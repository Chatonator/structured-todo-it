import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Divide, FolderPlus, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface SlotBoxProps {
  slot: DivisionSlot;
  isRoot?: boolean;
  onClick: (slotId: DivisionSlotId) => void;
}

const SlotBox: React.FC<SlotBoxProps> = ({ slot, isRoot = false, onClick }) => {
  const isFilled = slot.name.trim().length > 0;

  return (
    <button
      type="button"
      onClick={() => onClick(slot.id)}
      className={[
        'w-full rounded-xl border text-left transition-colors',
        isRoot ? 'min-h-[88px] px-5 py-4' : 'min-h-[72px] px-4 py-3',
        isFilled
          ? 'bg-card hover:border-primary/40 hover:bg-primary/5'
          : 'border-dashed bg-muted/35 text-muted-foreground hover:border-primary/30 hover:bg-muted/60',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {isRoot ? 'Départ' : 'Sous-tâche'}
          </div>
          <div className={isRoot ? 'text-base font-semibold break-words' : 'text-sm font-medium break-words'}>
            {isFilled ? slot.name : 'Vide'}
          </div>
        </div>
        <div className="text-xs font-medium text-muted-foreground shrink-0">
          {isFilled ? 'Modifier' : 'Ajouter'}
        </div>
      </div>
    </button>
  );
};

const ConnectorRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative flex flex-wrap items-start justify-center gap-4 pt-6 before:absolute before:left-[10%] before:right-[10%] before:top-0 before:h-px before:bg-border">
    {children}
  </div>
);

const Division33Tool: React.FC<ToolProps> = () => {
  const { tasks, addTask, updateTask, removeTask, reload: reloadTasks } = useTasks();
  const { createProject, reloadProjects } = useProjects();
  const { toast } = useToast();

  const [slots, setSlots] = useState<Record<DivisionSlotId, DivisionSlot>>(() => createEmptySlots());
  const [activeSlotId, setActiveSlotId] = useState<DivisionSlotId | null>(null);
  const [draftName, setDraftName] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const importer = useTaskLinker({ mode: 'single' });
  const activeSlot = activeSlotId ? slots[activeSlotId] : null;

  const selectedImportedTask = importer.selectedTasks[0] ?? null;
  const selectedImportedIds = useMemo(() => {
    return ALL_SLOT_IDS
      .map((slotId) => slots[slotId].sourceTaskId)
      .filter(Boolean) as string[];
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

  const inferredContext: TaskContext = rootImportedTask?.context || 'Perso';
  const inferredCategory: TaskCategory = rootImportedTask?.category || 'Autres';
  const inferredDuration = rootImportedTask?.estimatedTime || 30;

  const filledCount = useMemo(() => countFilledSlots(slots), [slots]);
  const mermaidGraph = useMemo(() => buildMermaidGraph(slots), [slots]);
  const draftTree = useMemo(() => buildDraftTree(slots), [slots]);

  const canApply = slots.root.name.trim().length > 0;

  useEffect(() => {
    if (!activeSlot) {
      setDraftName('');
      importer.clear();
      return;
    }

    setDraftName(activeSlot.name);
    importer.clear();
  }, [activeSlotId]);

  const openEditor = useCallback((slotId: DivisionSlotId) => {
    setActiveSlotId(slotId);
  }, []);

  const closeEditor = useCallback(() => {
    setActiveSlotId(null);
    setDraftName('');
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
      const duration = importedTask?.estimatedTime || durations[index] || 5;
      const category = importedTask?.category || inferredCategory;
      const context = importedTask?.context || inferredContext;

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
  }, [addTask, tasks, inferredCategory, inferredContext]);

  const applyStructure = useCallback(async (target: ApplyTarget) => {
    if (!canApply) return;

    const rootName = slots.root.name.trim();
    const flags = eisenhowerFromCategory(inferredCategory);

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
            category: inferredCategory,
            context: inferredContext,
            estimatedTime: inferredDuration,
            duration: inferredDuration,
          });
          await removeDirectChildren(rootImportedTask.id);
          await createNodeChildren(draftTree.children, 1, inferredDuration, { parentId: rootImportedTask.id });
        } else {
          const createdRoot = await addTask({
            name: rootName,
            category: inferredCategory,
            context: inferredContext,
            estimatedTime: inferredDuration,
            duration: inferredDuration,
            level: 0,
            isExpanded: true,
            isCompleted: false,
          } as Omit<Task, 'id' | 'createdAt'>);
          const rootId = (createdRoot as { id?: string } | undefined)?.id;
          if (rootId) {
            await createNodeChildren(draftTree.children, 1, inferredDuration, { parentId: rootId });
          }
        }
      }

      if (target === 'project') {
        const project = await createProject(
          rootName,
          undefined,
          '🧩',
          '#0f766e',
          inferredContext,
          flags.isImportant,
          flags.isUrgent
        );

        if (!project) {
          throw new Error('Impossible de créer le projet');
        }

        await createNodeChildren(draftTree.children, 0 as 1, inferredDuration, { projectId: project.id });

        if (rootImportedTask) {
          await removeDirectChildren(rootImportedTask.id);
          await updateTask(rootImportedTask.id, {
            isCompleted: true,
            name: rootName,
            category: inferredCategory,
            context: inferredContext,
            estimatedTime: inferredDuration,
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
    inferredCategory,
    inferredContext,
    inferredDuration,
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
          Cliquez sur une case pour la remplir. Une case vide ne crée rien. Une case remplie deviendra une sous-tâche quand vous validerez la structure.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Divide className="w-5 h-5 text-primary" />
            Canevas 3x3
          </CardTitle>
          <CardDescription>
            Commencez par le bloc de départ, puis ajoutez jusqu’à 3 branches et 3 sous-branches par branche.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 overflow-x-auto">
          <div className="min-w-[54rem] space-y-6 px-2 pb-2">
            <div className="flex justify-center">
              <div className="w-[18rem]">
                <SlotBox slot={slots.root} isRoot onClick={openEditor} />
              </div>
            </div>

            <div className="flex justify-center">
              <div className="h-6 w-px bg-border" />
            </div>

            <ConnectorRow>
              {branchColumns.map(({ branch, leaves }) => (
                <div key={branch.id} className="relative w-[16rem] space-y-5 before:absolute before:left-1/2 before:top-0 before:h-5 before:w-px before:-translate-x-1/2 before:bg-border">
                  <SlotBox slot={branch} onClick={openEditor} />
                  <div className="flex justify-center">
                    <div className="h-4 w-px bg-border" />
                  </div>
                  <ConnectorRow>
                    {leaves.map((leaf) => (
                      <div key={leaf.id} className="relative w-[4.75rem] before:absolute before:left-1/2 before:top-0 before:h-4 before:w-px before:-translate-x-1/2 before:bg-border">
                        <SlotBox slot={leaf} onClick={openEditor} />
                      </div>
                    ))}
                  </ConnectorRow>
                </div>
              ))}
            </ConnectorRow>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{filledCount} case{filledCount > 1 ? 's' : ''} remplie{filledCount > 1 ? 's' : ''}</Badge>
              <Badge variant="outline">Contexte : {inferredContext}</Badge>
              <Badge variant="outline">Catégorie : {inferredCategory}</Badge>
              <Badge variant="outline">Référence : {inferredDuration} min</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              La complexité reste cachée : si vous importez une tâche au départ, ses réglages servent de base. Sinon l’outil utilise des valeurs simples par défaut.
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

      <details className="rounded-lg border bg-muted/20 p-4">
        <summary className="cursor-pointer text-sm font-medium">Voir le code Mermaid</summary>
        <Textarea value={mermaidGraph} readOnly className="mt-4 min-h-[180px] font-mono text-xs" />
      </details>

      <Dialog open={activeSlotId !== null} onOpenChange={(open) => !open && closeEditor()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la case</DialogTitle>
            <DialogDescription>
              Donnez un nom à la case ou importez une tâche existante. Les cases vides restent simplement inactives dans la structure finale.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="new" className="space-y-4">
            <TabsList>
              <TabsTrigger value="new">Nouveau</TabsTrigger>
              <TabsTrigger value="import">Importer une tâche</TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="space-y-4">
              <div className="grid gap-2">
                <Input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder={activeSlotId === ROOT_SLOT_ID ? 'Ex. Préparer le lancement' : 'Ex. Faire la vaisselle'}
                  onKeyDown={(event) => event.key === 'Enter' && saveDraftName()}
                />
                <p className="text-xs text-muted-foreground">
                  Si vous laissez cette case vide, elle ne sera pas créée lors de l’application.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="import" className="space-y-4">
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
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 sm:gap-0">
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Division33Tool;
