import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Divide, FolderPlus, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ContextPillSelector } from '@/components/common/ContextPillSelector';
import { EisenhowerSelector } from '@/components/common/EisenhowerSelector';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ToolProps } from '../types';
import { TaskLinker } from '../../shared/TaskLinker';
import { useTaskLinker } from '../../shared/useTaskLinker';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import { Task, TaskCategory, TaskContext, eisenhowerFromCategory } from '@/types/task';
import {
  ALL_SLOT_IDS,
  buildDraftTree,
  clearSlotAndDescendants,
  countFilledSlots,
  createEmptySlots,
  distributeDuration,
  DivisionDraftNode,
  DivisionSlot,
  DivisionSlotId,
  FIRST_LEVEL_SLOT_IDS,
  hydrateSlotsFromTaskTree,
  ROOT_SLOT_ID,
  SECOND_LEVEL_SLOT_IDS_BY_PARENT,
  updateSlot,
} from './division33Utils';

type ApplyTarget = 'task' | 'project';
type EditorMode = 'new' | 'import';
type SlotTone = 'root' | 'branch' | 'leaf';

const DEFAULT_ROOT_DURATION = 30;

interface SlotBoxProps {
  slot: DivisionSlot;
  tone: SlotTone;
  onClick: (slotId: DivisionSlotId) => void;
}

const SLOT_TONE_LABELS: Record<SlotTone, string> = {
  root: 'Départ',
  branch: 'Branche',
  leaf: 'Sous-tâche',
};

const SlotBox: React.FC<SlotBoxProps> = ({ slot, tone, onClick }) => {
  const isFilled = slot.name.trim().length > 0;

  const sizeClass = tone === 'root'
    ? 'min-h-[112px] px-6 py-5'
    : tone === 'branch'
      ? 'min-h-[108px] px-5 py-4'
      : 'min-h-[92px] px-4 py-4';

  const filledClass = tone === 'root'
    ? 'border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 shadow-[0_18px_45px_-28px_hsl(var(--primary)/0.45)] hover:border-primary/35 hover:shadow-[0_24px_55px_-30px_hsl(var(--primary)/0.5)]'
    : tone === 'branch'
      ? 'border-border/80 bg-gradient-to-br from-card via-card to-primary/[0.03] shadow-[0_12px_28px_-22px_hsl(var(--foreground)/0.25)] hover:border-primary/25 hover:shadow-[0_18px_35px_-25px_hsl(var(--primary)/0.3)]'
      : 'border-border/75 bg-card/95 shadow-[0_10px_24px_-24px_hsl(var(--foreground)/0.25)] hover:border-primary/20 hover:bg-primary/[0.025]';

  const emptyClass = tone === 'root'
    ? 'border-dashed border-border/70 bg-gradient-to-br from-muted/55 to-muted/35 text-muted-foreground hover:border-primary/20 hover:bg-primary/[0.035]'
    : 'border-dashed border-border/65 bg-muted/35 text-muted-foreground hover:border-primary/15 hover:bg-muted/55';

  const titleClass = tone === 'root'
    ? 'mt-2 text-xl font-semibold leading-tight break-words text-foreground'
    : tone === 'branch'
      ? 'mt-2 text-base font-semibold leading-snug break-words text-foreground'
      : 'mt-1.5 text-sm font-medium leading-snug break-words text-foreground';

  return (
    <button
      type="button"
      onClick={() => onClick(slot.id)}
      className={[
        'group w-full rounded-[28px] border text-left transition-all duration-200',
        sizeClass,
        isFilled ? filledClass : emptyClass,
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/90">
            {SLOT_TONE_LABELS[tone]}
          </div>
          <div className={titleClass}>{isFilled ? slot.name : 'Vide'}</div>
        </div>
        <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground opacity-90 transition-opacity group-hover:opacity-100 shrink-0">
          {isFilled ? <Pencil className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          {isFilled ? 'Éditer' : 'Ajouter'}
        </div>
      </div>
    </button>
  );
};

const Division33Tool: React.FC<ToolProps> = () => {
  const { tasks, addTask, updateTask, removeTask, reload: reloadTasks } = useTasks();
  const { createProject, reloadProjects } = useProjects();
  const { toast } = useToast();

  const [slots, setSlots] = useState<Record<DivisionSlotId, DivisionSlot>>(() => createEmptySlots());
  const [activeSlotId, setActiveSlotId] = useState<DivisionSlotId | null>(null);
  const [draftName, setDraftName] = useState('');
  const [editorMode, setEditorMode] = useState<EditorMode>('new');
  const [isApplying, setIsApplying] = useState(false);
  const [rootContext, setRootContext] = useState<TaskContext>('Perso');
  const [rootCategory, setRootCategory] = useState<TaskCategory>('Autres');
  const [rootDuration, setRootDuration] = useState(DEFAULT_ROOT_DURATION);

  const activeSlot = activeSlotId ? slots[activeSlotId] : null;
  const isRootEditor = activeSlotId === ROOT_SLOT_ID;

  const selectedImportedIds = useMemo(() => {
    return ALL_SLOT_IDS.map((slotId) => slots[slotId].sourceTaskId).filter(Boolean) as string[];
  }, [slots]);

  const importerExcludeIds = useMemo(() => {
    return selectedImportedIds.filter((id) => id !== activeSlot?.sourceTaskId);
  }, [selectedImportedIds, activeSlot?.sourceTaskId]);

  const importer = useTaskLinker({ mode: 'single', initialScope: 'free', excludeIds: importerExcludeIds });
  const selectedImportedTask = importer.selectedTasks[0] ?? null;

  const rootImportedTask = useMemo(() => {
    const rootId = slots.root.sourceTaskId;
    return rootId ? tasks.find((task) => task.id === rootId) ?? null : null;
  }, [slots, tasks]);

  const filledCount = useMemo(() => countFilledSlots(slots), [slots]);
  const draftTree = useMemo(() => buildDraftTree(slots), [slots]);
  const canApply = slots.root.name.trim().length > 0;

  useEffect(() => {
    if (!activeSlot) {
      setDraftName('');
      setEditorMode('new');
      importer.clear();
      return;
    }

    setDraftName(activeSlot.name);
    setEditorMode(activeSlot.sourceTaskId ? 'import' : 'new');
    importer.clear();
  }, [activeSlotId]);

  useEffect(() => {
    if (!rootImportedTask) return;
    setRootContext(rootImportedTask.context || 'Perso');
    setRootCategory(rootImportedTask.category || 'Autres');
  }, [rootImportedTask?.id]);

  const openEditor = useCallback((slotId: DivisionSlotId) => {
    setActiveSlotId(slotId);
  }, []);

  const closeEditor = useCallback(() => {
    setActiveSlotId(null);
    setDraftName('');
    setEditorMode('new');
    importer.clear();
  }, [importer]);

  const saveDraftName = useCallback(() => {
    if (!activeSlotId) return;

    const trimmedName = draftName.trim();
    setSlots((current) => updateSlot(current, activeSlotId, {
      name: trimmedName,
      sourceTaskId: trimmedName ? undefined : current[activeSlotId].sourceTaskId,
    }));
    closeEditor();
  }, [activeSlotId, draftName, closeEditor]);

  const importTaskIntoSlot = useCallback((task: Task) => {
    if (!activeSlotId) return;

    setSlots((current) => {
      if (activeSlotId === ROOT_SLOT_ID) {
        return hydrateSlotsFromTaskTree(task, tasks);
      }

      if (FIRST_LEVEL_SLOT_IDS.includes(activeSlotId as typeof FIRST_LEVEL_SLOT_IDS[number])) {
        let next = clearSlotAndDescendants(current, activeSlotId);
        next = updateSlot(next, activeSlotId, {
          name: task.name,
          sourceTaskId: task.id,
        });

        const childSlotIds = SECOND_LEVEL_SLOT_IDS_BY_PARENT[activeSlotId as 'b1' | 'b2' | 'b3'];
        const subtasks = tasks.filter((candidate) => candidate.parentId === task.id).slice(0, 3);
        subtasks.forEach((subtask, index) => {
          next = updateSlot(next, childSlotIds[index], {
            name: subtask.name,
            sourceTaskId: subtask.id,
          });
        });
        return next;
      }

      return updateSlot(current, activeSlotId, {
        name: task.name,
        sourceTaskId: task.id,
      });
    });

    closeEditor();
  }, [activeSlotId, tasks, closeEditor]);

  useEffect(() => {
    if (selectedImportedTask && activeSlotId) {
      importTaskIntoSlot(selectedImportedTask);
    }
  }, [selectedImportedTask, activeSlotId, importTaskIntoSlot]);

  const clearCurrentSlot = useCallback(() => {
    if (!activeSlotId) return;
    setSlots((current) => clearSlotAndDescendants(current, activeSlotId));
    closeEditor();
  }, [activeSlotId, closeEditor]);

  const resetTool = useCallback(() => {
    setSlots(createEmptySlots());
    setRootContext('Perso');
    setRootCategory('Autres');
    setRootDuration(DEFAULT_ROOT_DURATION);
    closeEditor();
  }, [closeEditor]);

  const removeDirectChildren = useCallback(async (parentId: string) => {
    const directChildren = tasks.filter((task) => task.parentId === parentId);
    for (const child of directChildren) {
      await removeTask(child.id);
    }
  }, [tasks, removeTask]);

  const createNodeChildren = useCallback(async (
    nodes: DivisionDraftNode[],
    level: 1 | 2,
    totalDuration: number,
    options: { parentId?: string; projectId?: string }
  ) => {
    if (nodes.length === 0) return;

    const durations = distributeDuration(totalDuration, nodes.length);

    for (const [index, node] of nodes.entries()) {
      const importedTask = node.sourceTaskId ? tasks.find((task) => task.id === node.sourceTaskId) : null;
      const duration = durations[index] || 5;
      const category = importedTask?.category || rootCategory;
      const context = importedTask?.context || rootContext;

      const created = await addTask({
        name: node.name,
        category,
        context,
        estimatedTime: duration,
        duration,
        level,
        parentId: options.parentId,
        projectId: options.projectId,
        isExpanded: true,
        isCompleted: false,
      } as Omit<Task, 'id' | 'createdAt'>);

      const createdId = (created as { id?: string } | undefined)?.id;
      if (createdId && node.children.length > 0 && level < 2) {
        await createNodeChildren(node.children, 2, duration, {
          parentId: createdId,
          projectId: options.projectId,
        });
      }
    }
  }, [addTask, tasks, rootCategory, rootContext]);

  const applyStructure = useCallback(async (target: ApplyTarget) => {
    if (!canApply) return;

    const rootName = slots.root.name.trim();
    const safeRootDuration = Math.max(5, Number.isFinite(rootDuration) ? Math.round(rootDuration) : DEFAULT_ROOT_DURATION);
    const flags = eisenhowerFromCategory(rootCategory);

    if (rootImportedTask) {
      const existingChildren = tasks.filter((task) => task.parentId === rootImportedTask.id);
      if (existingChildren.length > 0) {
        const confirmed = window.confirm(
          target === 'project'
            ? `La structure actuelle de \"${rootImportedTask.name}\" sera remplacée avant conversion en projet. Continuer ?`
            : `Les sous-tâches actuelles de \"${rootImportedTask.name}\" seront remplacées. Continuer ?`
        );
        if (!confirmed) return;
      }
    }

    setIsApplying(true);
    try {
      if (target === 'task') {
        if (rootImportedTask) {
          await updateTask(rootImportedTask.id, {
            name: rootName,
            category: rootCategory,
            context: rootContext,
            estimatedTime: safeRootDuration,
            duration: safeRootDuration,
          });
          await removeDirectChildren(rootImportedTask.id);
          await createNodeChildren(draftTree.children, 1, safeRootDuration, { parentId: rootImportedTask.id });
        } else {
          const createdRoot = await addTask({
            name: rootName,
            category: rootCategory,
            context: rootContext,
            estimatedTime: safeRootDuration,
            duration: safeRootDuration,
            level: 0,
            isExpanded: true,
            isCompleted: false,
          } as Omit<Task, 'id' | 'createdAt'>);
          const rootId = (createdRoot as { id?: string } | undefined)?.id;
          if (rootId) {
            await createNodeChildren(draftTree.children, 1, safeRootDuration, { parentId: rootId });
          }
        }
      }

      if (target === 'project') {
        const project = await createProject(
          rootName,
          undefined,
          '🧩',
          '#0f766e',
          rootContext,
          flags.isImportant,
          flags.isUrgent
        );

        if (!project) {
          throw new Error('Impossible de créer le projet');
        }

        await createNodeChildren(draftTree.children, 1, safeRootDuration, { projectId: project.id });

        if (rootImportedTask) {
          await removeDirectChildren(rootImportedTask.id);
          await updateTask(rootImportedTask.id, {
            isCompleted: true,
            name: rootName,
            category: rootCategory,
            context: rootContext,
            estimatedTime: safeRootDuration,
            metadata: {
              archivedToProject: project.id,
              archivedAt: new Date(),
            } as any,
          } as Partial<Task>);
        }
      }

      await reloadTasks();
      reloadProjects();
      toast({
        title: target === 'project' ? 'Projet créé' : 'Structure appliquée',
        description: target === 'project'
          ? 'La structure visuelle a été convertie en projet.'
          : 'La structure visuelle a été convertie en tâche et sous-tâches.',
      });
      resetTool();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error?.message || 'Impossible d’appliquer la structure.',
        variant: 'destructive',
      });
    } finally {
      setIsApplying(false);
    }
  }, [
    canApply,
    slots,
    rootCategory,
    rootContext,
    rootDuration,
    rootImportedTask,
    tasks,
    draftTree.children,
    updateTask,
    removeDirectChildren,
    createNodeChildren,
    addTask,
    createProject,
    reloadTasks,
    reloadProjects,
    toast,
    resetTool,
  ]);

  const branchColumns = FIRST_LEVEL_SLOT_IDS.map((slotId) => ({
    branch: slots[slotId],
    leaves: SECOND_LEVEL_SLOT_IDS_BY_PARENT[slotId].map((childId) => slots[childId]),
  }));

  return (
    <div className="space-y-6">
      <Alert className="border-primary/15 bg-gradient-to-r from-primary/[0.04] via-background to-background">
        <Sparkles className="h-4 w-4 text-primary" />
        <AlertTitle>Division visuelle</AlertTitle>
        <AlertDescription>
          Commencez par le départ, puis ajoutez seulement les branches utiles.
        </AlertDescription>
      </Alert>

      <Card className="overflow-hidden border-border/70 bg-gradient-to-b from-background via-background to-muted/[0.22] shadow-[0_24px_60px_-48px_hsl(var(--foreground)/0.4)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Divide className="w-5 h-5 text-primary" />
            Carte 3x3
          </CardTitle>
          <CardDescription>
            Une vue simple pour découper une idée en branches et sous-tâches.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto pt-2">
          <div className="min-w-[62rem] rounded-[32px] border border-border/60 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.06),transparent_35%)] px-6 py-8">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-8">
              <div className="w-[24rem] max-w-full">
                <SlotBox slot={slots.root} tone="root" onClick={openEditor} />
              </div>

              <div className="flex h-8 w-px rounded-full bg-gradient-to-b from-primary/25 to-border/50" />

              <div className="grid w-full grid-cols-3 gap-8 items-start">
                {branchColumns.map(({ branch, leaves }, columnIndex) => (
                  <div key={branch.id} className="relative flex flex-col items-center gap-4 px-2">
                    <div className="pointer-events-none absolute left-1/2 top-0 h-6 w-px -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/20 to-border/40" />
                    <div className="w-full rounded-[30px] border border-border/55 bg-background/70 px-4 pb-4 pt-6 shadow-[0_18px_40px_-34px_hsl(var(--foreground)/0.35)] backdrop-blur-sm">
                      <div className="mx-auto mb-4 h-1 w-16 rounded-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                      <SlotBox slot={branch} tone="branch" onClick={openEditor} />

                      {branch.name.trim().length > 0 && (
                        <div className="mt-5 space-y-3">
                          <div className="flex justify-center">
                            <div className="h-5 w-px rounded-full bg-gradient-to-b from-primary/15 to-border/40" />
                          </div>
                          <div className="space-y-3">
                            {leaves.map((leaf, leafIndex) => (
                              <div key={leaf.id} className="relative pl-4">
                                <div className="pointer-events-none absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 rounded-full bg-gradient-to-r from-border/40 to-primary/15" />
                                <SlotBox slot={leaf} tone="leaf" onClick={openEditor} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {branch.name.trim().length === 0 && (
                        <div className="mt-4 rounded-2xl border border-dashed border-border/55 bg-muted/25 px-4 py-3 text-center text-xs text-muted-foreground">
                          Branche {columnIndex + 1} vide pour l’instant.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-background/80 shadow-[0_16px_40px_-40px_hsl(var(--foreground)/0.45)]">
        <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-foreground">
              {filledCount} case{filledCount > 1 ? 's' : ''} remplie{filledCount > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              Astuce: faites d’abord apparaître les grandes branches, puis ajoutez les détails seulement quand la structure devient claire.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={resetTool}>Réinitialiser</Button>
            <Button variant="outline" onClick={() => applyStructure('task')} disabled={!canApply || isApplying}>
              <Plus className="w-4 h-4 mr-2" />
              Appliquer en tâche
            </Button>
            <Button onClick={() => applyStructure('project')} disabled={!canApply || isApplying}>
              <FolderPlus className="w-4 h-4 mr-2" />
              {isApplying ? 'Application...' : 'Appliquer en projet'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Sheet open={activeSlotId !== null} onOpenChange={(open) => !open && closeEditor()}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{isRootEditor ? 'Modifier le départ' : 'Modifier la case'}</SheetTitle>
            <SheetDescription>
              {isRootEditor
                ? 'Définissez le nom du départ, ses réglages de base et, si besoin, importez une tâche existante.'
                : 'Donnez un nom à la case ou importez une tâche existante. Les cases vides restent simplement inactives dans la structure finale.'}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-2">
              <Button variant={editorMode === 'new' ? 'default' : 'outline'} onClick={() => setEditorMode('new')}>
                Nouveau
              </Button>
              <Button variant={editorMode === 'import' ? 'default' : 'outline'} onClick={() => setEditorMode('import')}>
                Importer
              </Button>
            </div>

            {editorMode === 'new' && (
              <div className="space-y-3">
                <Input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder={isRootEditor ? 'Ex. Organiser la maison' : 'Ex. Faire la vaisselle'}
                  onKeyDown={(event) => event.key === 'Enter' && saveDraftName()}
                />
                <p className="text-xs text-muted-foreground">
                  Si vous laissez cette case vide, elle ne sera pas créée lors de l’application.
                </p>
              </div>
            )}

            {editorMode === 'import' && (
              <TaskLinker
                mode="single"
                max={1}
                selectedTasks={importer.selectedTasks}
                filteredAvailableTasks={importer.filteredAvailableTasks}
                groupedAvailableTasks={importer.groupedAvailableTasks}
                filteredCount={importer.filteredCount}
                totalCount={importer.totalCount}
                search={importer.filters.search}
                scopeFilter={importer.filters.scope}
                contextFilter={importer.filters.context}
                categoryFilter={importer.filters.category}
                priorityFilter={importer.filters.priority}
                sortOption={importer.sort}
                canSelectMore={importer.canSelectMore}
                onSelect={importer.select}
                onDeselect={importer.deselect}
                onSearchChange={importer.setSearch}
                onScopeFilterChange={importer.setScopeFilter}
                onContextFilterChange={importer.setContextFilter}
                onCategoryFilterChange={importer.setCategoryFilter}
                onPriorityFilterChange={importer.setPriorityFilter}
                onSortChange={importer.setSort}
                placeholder="Choisir une tâche..."
                variant="inline"
                showScopeFilter={false}
              />
            )}

            {isRootEditor && (
              <div className="space-y-4 rounded-2xl border bg-muted/20 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Réglages du départ</p>
                  <p className="text-xs text-muted-foreground">
                    Le contexte et la catégorie restent modifiables, même si vous partez d’une tâche importée. La durée n’est jamais héritée.
                  </p>
                </div>
                {rootImportedTask && (
                  <p className="text-xs text-muted-foreground">
                    Base importée: <span className="font-medium text-foreground">{rootImportedTask.name}</span>
                  </p>
                )}
                <ContextPillSelector value={rootContext} onChange={setRootContext} />
                <EisenhowerSelector value={rootCategory} onChange={setRootCategory} required={false} />
                <div className="space-y-2">
                  <Label htmlFor="division-root-duration" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Durée de base
                  </Label>
                  <Input
                    id="division-root-duration"
                    type="number"
                    min={5}
                    step={5}
                    value={rootDuration}
                    onChange={(event) => setRootDuration(Math.max(5, Number(event.target.value) || DEFAULT_ROOT_DURATION))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Cette valeur sert de repère pour la tâche finale et la répartition des sous-tâches.
                  </p>
                </div>
              </div>
            )}
          </div>

          <SheetFooter className="mt-6 gap-2 sm:gap-0">
            {activeSlotId && (
              <Button variant="ghost" onClick={clearCurrentSlot} className="text-destructive mr-auto">
                <Trash2 className="w-4 h-4 mr-2" />
                Vider la case
              </Button>
            )}
            <Button variant="outline" onClick={closeEditor}>Annuler</Button>
            <Button onClick={saveDraftName}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Division33Tool;

