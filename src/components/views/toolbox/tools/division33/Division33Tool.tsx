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
import { Textarea } from '@/components/ui/textarea';
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
  buildMermaidGraph,
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

const DEFAULT_ROOT_DURATION = 30;

interface SlotBoxProps {
  slot: DivisionSlot;
  isRoot?: boolean;
  compact?: boolean;
  onClick: (slotId: DivisionSlotId) => void;
}

const SlotBox: React.FC<SlotBoxProps> = ({ slot, isRoot = false, compact = false, onClick }) => {
  const isFilled = slot.name.trim().length > 0;

  return (
    <button
      type="button"
      onClick={() => onClick(slot.id)}
      className={[
        'w-full rounded-2xl border text-left transition-all duration-200',
        isRoot ? 'min-h-[96px] px-5 py-4' : compact ? 'min-h-[88px] px-4 py-4' : 'min-h-[92px] px-4 py-4',
        isFilled
          ? 'border-border/80 bg-card shadow-sm hover:border-primary/40 hover:bg-primary/[0.04] hover:shadow-md'
          : 'border-dashed border-border/70 bg-muted/40 text-muted-foreground hover:border-primary/20 hover:bg-muted/60',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {isRoot ? 'Départ' : 'Sous-tâche'}
          </div>
          <div className={isRoot ? 'mt-1 text-lg font-semibold leading-tight break-words' : 'mt-1 text-sm font-medium leading-snug break-words'}>
            {isFilled ? slot.name : 'Vide'}
          </div>
        </div>
        <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground shrink-0">
          {isFilled ? <Pencil className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {isFilled ? 'Modifier' : 'Ajouter'}
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

  const importer = useTaskLinker({ mode: 'single' });
  const activeSlot = activeSlotId ? slots[activeSlotId] : null;

  const selectedImportedTask = importer.selectedTasks[0] ?? null;
  const selectedImportedIds = useMemo(() => {
    return ALL_SLOT_IDS.map((slotId) => slots[slotId].sourceTaskId).filter(Boolean) as string[];
  }, [slots]);

  const selectableTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (task.isCompleted || task.projectId) return false;
      if (selectedImportedIds.includes(task.id) && task.id !== activeSlot?.sourceTaskId) return false;
      if (importer.filters.context !== 'all' && task.context !== importer.filters.context) return false;
      if (importer.filters.category !== 'all' && task.category !== importer.filters.category) return false;
      if (importer.filters.priority === 'none' && task.subCategory) return false;
      if (importer.filters.priority !== 'all' && importer.filters.priority !== 'none' && task.subCategory !== importer.filters.priority) return false;
      if (importer.filters.search.trim() && !task.name.toLowerCase().includes(importer.filters.search.toLowerCase())) return false;
      return true;
    }).slice(0, 50);
  }, [tasks, selectedImportedIds, activeSlot, importer.filters]);

  const totalSelectableTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (task.isCompleted || task.projectId) return false;
      if (selectedImportedIds.includes(task.id) && task.id !== activeSlot?.sourceTaskId) return false;
      if (importer.filters.context !== 'all' && task.context !== importer.filters.context) return false;
      if (importer.filters.category !== 'all' && task.category !== importer.filters.category) return false;
      if (importer.filters.priority === 'none' && task.subCategory) return false;
      if (importer.filters.priority !== 'all' && importer.filters.priority !== 'none' && task.subCategory !== importer.filters.priority) return false;
      if (importer.filters.search.trim() && !task.name.toLowerCase().includes(importer.filters.search.toLowerCase())) return false;
      return true;
    }).length;
  }, [tasks, selectedImportedIds, activeSlot, importer.filters]);

  const rootImportedTask = useMemo(() => {
    const rootId = slots.root.sourceTaskId;
    return rootId ? tasks.find((task) => task.id === rootId) ?? null : null;
  }, [slots, tasks]);

  const filledCount = useMemo(() => countFilledSlots(slots), [slots]);
  const mermaidGraph = useMemo(() => buildMermaidGraph(slots), [slots]);
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
      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertTitle>Division visuelle</AlertTitle>
        <AlertDescription>
          Cliquez sur une case pour la remplir. Une case vide ne crée rien. Commencez par le bloc de départ, puis ajoutez seulement les branches utiles.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Divide className="w-5 h-5 text-primary" />
            Canevas 3x3
          </CardTitle>
          <CardDescription>
            Commencez par le bloc de départ. Les sous-cases n’apparaissent que quand leur branche devient utile.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[58rem] space-y-8 px-3 pb-4">
            <div className="flex justify-center">
              <div className="w-[22rem]">
                <SlotBox slot={slots.root} isRoot onClick={openEditor} />
              </div>
            </div>

            <div className="mx-auto max-w-5xl rounded-3xl border bg-card/80 p-4">
              <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_180px]">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Réglages du départ</p>
                  <p className="text-xs text-muted-foreground">
                    Le contexte et la catégorie restent modifiables, même si vous partez d’une tâche importée. La durée sert seulement de base pour répartir l’estimation.
                  </p>
                  {rootImportedTask && (
                    <p className="text-xs text-muted-foreground">
                      Base importée: <span className="font-medium text-foreground">{rootImportedTask.name}</span>
                    </p>
                  )}
                </div>
                <div className="space-y-4">
                  <ContextPillSelector value={rootContext} onChange={setRootContext} />
                  <EisenhowerSelector value={rootCategory} onChange={setRootCategory} required={false} />
                </div>
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
                    Non héritée. Cette valeur sert de repère pour la tâche finale et la répartition des sous-tâches.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="h-8 w-px bg-border/70" />
            </div>

            <div className="grid grid-cols-3 gap-6 items-start">
              {branchColumns.map(({ branch, leaves }) => (
                <div key={branch.id} className="rounded-3xl border bg-muted/[0.18] p-4 space-y-4">
                  <div className="flex justify-center">
                    <div className="h-4 w-px bg-border/60" />
                  </div>
                  <SlotBox slot={branch} onClick={openEditor} />
                  {branch.name.trim().length > 0 && (
                    <>
                      <div className="flex justify-center">
                        <div className="h-4 w-px bg-border/60" />
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {leaves.map((leaf) => (
                          <SlotBox key={leaf.id} slot={leaf} compact onClick={openEditor} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {filledCount} case{filledCount > 1 ? 's' : ''} remplie{filledCount > 1 ? 's' : ''}. Les cases vides sont ignorées au moment de créer la structure.
            </p>
            <div className="rounded-2xl border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Conseil: commencez simple avec 2 ou 3 branches, puis ajoutez des sous-tâches seulement là où vous en avez vraiment besoin.
            </div>
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

      <details className="rounded-lg border bg-muted/20 p-4">
        <summary className="cursor-pointer text-sm font-medium">Voir le code Mermaid</summary>
        <Textarea value={mermaidGraph} readOnly className="mt-4 min-h-[180px] font-mono text-xs" />
      </details>

      <Sheet open={activeSlotId !== null} onOpenChange={(open) => !open && closeEditor()}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Modifier la case</SheetTitle>
            <SheetDescription>
              Donnez un nom à la case ou importez une tâche existante. Les cases vides restent simplement inactives dans la structure finale.
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
                  placeholder={activeSlotId === ROOT_SLOT_ID ? 'Ex. Organiser la maison' : 'Ex. Faire la vaisselle'}
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
                filteredAvailableTasks={selectableTasks}
                filteredCount={selectableTasks.length}
                totalCount={totalSelectableTasks}
                search={importer.filters.search}
                contextFilter={importer.filters.context}
                categoryFilter={importer.filters.category}
                priorityFilter={importer.filters.priority}
                canSelectMore={importer.canSelectMore}
                onSelect={importer.select}
                onDeselect={importer.deselect}
                onSearchChange={importer.setSearch}
                onContextFilterChange={importer.setContextFilter}
                onCategoryFilterChange={importer.setCategoryFilter}
                onPriorityFilterChange={importer.setPriorityFilter}
                placeholder="Choisir une tâche..."
                variant="inline"
              />
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
