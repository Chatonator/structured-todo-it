import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, Divide, FolderTree, GitBranchPlus, Layers3, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TaskLinker } from '../../shared/TaskLinker';
import { useTaskLinker } from '../../shared/useTaskLinker';
import { ToolProps } from '../types';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useToast } from '@/hooks/use-toast';
import { CATEGORY_DISPLAY_NAMES, Task, TaskCategory, TaskContext, eisenhowerFromCategory } from '@/types/task';
import {
  addChildNode,
  buildMermaidGraph,
  cloneTaskTree,
  countLeaves,
  countNodes,
  createInitialDraft,
  DIVISION_MAX_CHILDREN,
  DIVISION_MAX_DEPTH,
  distributeDuration,
  DivisionDraftNode,
  ensureChildCount,
  moveNode,
  removeNode,
  updateNodeName,
} from './division33Utils';

type StructureTarget = 'task' | 'project';
type SourceMode = 'blank' | 'existing';

const CATEGORY_OPTIONS: TaskCategory[] = ['Obligation', 'Quotidien', 'Envie', 'Autres'];
const CONTEXT_OPTIONS: TaskContext[] = ['Perso', 'Pro'];

interface DraftEditorNodeProps {
  node: DivisionDraftNode;
  depth: number;
  index: number;
  siblingCount: number;
  onRename: (nodeId: string, name: string) => void;
  onAddChild: (nodeId: string) => void;
  onPresetChildren: (nodeId: string, count: number) => void;
  onRemove: (nodeId: string) => void;
  onMove: (nodeId: string, direction: -1 | 1) => void;
}

const DraftEditorNode: React.FC<DraftEditorNodeProps> = ({
  node,
  depth,
  index,
  siblingCount,
  onRename,
  onAddChild,
  onPresetChildren,
  onRemove,
  onMove,
}) => {
  const canAddChildren = depth < DIVISION_MAX_DEPTH && node.children.length < DIVISION_MAX_CHILDREN;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-card/70 p-3 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">Niveau {depth + 1}</Badge>
          <Badge variant="secondary">{node.children.length}/{DIVISION_MAX_CHILDREN} branche{node.children.length > 1 ? 's' : ''}</Badge>
          {depth < DIVISION_MAX_DEPTH ? (
            <span className="text-xs text-muted-foreground">Jusqu'à {DIVISION_MAX_CHILDREN} sous-branches</span>
          ) : (
            <span className="text-xs text-muted-foreground">Profondeur maximale atteinte</span>
          )}
        </div>

        <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
          <Input
            value={node.name}
            onChange={(event) => onRename(node.id, event.target.value)}
            placeholder={depth === 0 ? 'Nom de la tâche racine' : 'Nom de la branche'}
          />
          <div className="flex items-center gap-1 flex-wrap justify-end">
            {depth < DIVISION_MAX_DEPTH && (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => onPresetChildren(node.id, 2)}>
                  2 branches
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => onPresetChildren(node.id, 3)}>
                  3 branches
                </Button>
              </>
            )}
            {canAddChildren && (
              <Button type="button" variant="outline" size="sm" onClick={() => onAddChild(node.id)}>
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Button>
            )}
            {index > 0 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => onMove(node.id, -1)}>
                <ArrowUp className="w-4 h-4" />
              </Button>
            )}
            {index < siblingCount - 1 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => onMove(node.id, 1)}>
                <ArrowDown className="w-4 h-4" />
              </Button>
            )}
            {depth > 0 && (
              <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => onRemove(node.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {node.children.length > 0 && (
        <div className="ml-4 border-l pl-4 space-y-3">
          {node.children.map((child, childIndex) => (
            <DraftEditorNode
              key={child.id}
              node={child}
              depth={depth + 1}
              index={childIndex}
              siblingCount={node.children.length}
              onRename={onRename}
              onAddChild={onAddChild}
              onPresetChildren={onPresetChildren}
              onRemove={onRemove}
              onMove={onMove}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const DiagramBranch: React.FC<{ node: DivisionDraftNode; depth?: number }> = ({ node, depth = 0 }) => {
  return (
    <div className="flex flex-col items-center gap-3 min-w-[10rem]">
      <div className="rounded-xl border bg-background px-4 py-3 text-center shadow-sm w-full max-w-[14rem]">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Niveau {depth + 1}</div>
        <div className="font-medium text-sm break-words">{node.name || 'Sans titre'}</div>
      </div>

      {node.children.length > 0 && (
        <>
          <div className="h-4 w-px bg-border" />
          <div className="relative flex flex-wrap justify-center gap-4 pt-4 before:absolute before:left-8 before:right-8 before:top-0 before:h-px before:bg-border">
            {node.children.map((child) => (
              <div key={child.id} className="relative flex flex-col items-center before:absolute before:left-1/2 before:top-0 before:h-4 before:w-px before:-translate-x-1/2 before:bg-border">
                <DiagramBranch node={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const Division33Tool: React.FC<ToolProps> = () => {
  const { tasks, addTask, updateTask, removeTask, reload: reloadTasks } = useTasks();
  const { createProject, reloadProjects } = useProjects();
  const { toast } = useToast();

  const sourceLinker = useTaskLinker({
    mode: 'single',
    storageKey: 'division33-source',
  });

  const [sourceMode, setSourceMode] = useState<SourceMode>('blank');
  const [target, setTarget] = useState<StructureTarget>('task');
  const [draft, setDraft] = useState<DivisionDraftNode>(() => createInitialDraft(''));
  const [context, setContext] = useState<TaskContext>('Perso');
  const [category, setCategory] = useState<TaskCategory>('Autres');
  const [timeBudget, setTimeBudget] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const selectedSourceTask = sourceLinker.selectedTasks[0] ?? null;

  const totalSelectableSourceTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (task.isCompleted || task.level !== 0 || task.projectId) return false;
      if (sourceLinker.selectedIds.includes(task.id)) return false;
      if (sourceLinker.filters.context !== 'all' && task.context !== sourceLinker.filters.context) return false;
      if (sourceLinker.filters.category !== 'all' && task.category !== sourceLinker.filters.category) return false;
      if (sourceLinker.filters.priority === 'none' && task.subCategory) return false;
      if (sourceLinker.filters.priority !== 'all' && sourceLinker.filters.priority !== 'none' && task.subCategory !== sourceLinker.filters.priority) return false;
      if (sourceLinker.filters.search.trim() && !task.name.toLowerCase().includes(sourceLinker.filters.search.toLowerCase())) return false;
      return true;
    }).length;
  }, [tasks, sourceLinker.filters, sourceLinker.selectedIds]);

  const selectableSourceTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (task.isCompleted || task.level !== 0 || task.projectId) return false;
      if (sourceLinker.selectedIds.includes(task.id)) return false;
      if (sourceLinker.filters.context !== 'all' && task.context !== sourceLinker.filters.context) return false;
      if (sourceLinker.filters.category !== 'all' && task.category !== sourceLinker.filters.category) return false;
      if (sourceLinker.filters.priority === 'none' && task.subCategory) return false;
      if (sourceLinker.filters.priority !== 'all' && sourceLinker.filters.priority !== 'none' && task.subCategory !== sourceLinker.filters.priority) return false;
      if (sourceLinker.filters.search.trim() && !task.name.toLowerCase().includes(sourceLinker.filters.search.toLowerCase())) return false;
      return true;
    }).slice(0, 50);
  }, [tasks, sourceLinker.filters, sourceLinker.selectedIds]);

  useEffect(() => {
    if (sourceMode === 'blank') {
      setDraft(createInitialDraft(''));
      setContext('Perso');
      setCategory('Autres');
      setTimeBudget('');
      return;
    }

    if (!selectedSourceTask) {
      setDraft(createInitialDraft(''));
      setTimeBudget('');
      return;
    }

    setDraft(cloneTaskTree(selectedSourceTask, tasks));
    setContext(selectedSourceTask.context);
    setCategory(selectedSourceTask.category);
    setTimeBudget(String(selectedSourceTask.estimatedTime || ''));
  }, [sourceMode, selectedSourceTask, tasks]);

  const mermaidGraph = useMemo(() => buildMermaidGraph(draft), [draft]);
  const stats = useMemo(() => ({
    nodes: countNodes(draft),
    leaves: countLeaves(draft),
    firstLevel: draft.children.length,
  }), [draft]);

  const parsedTimeBudget = Number(timeBudget);
  const isDraftValid = draft.name.trim().length > 0 && Number.isFinite(parsedTimeBudget) && parsedTimeBudget > 0;
  const canApply = isDraftValid && (sourceMode === 'blank' || !!selectedSourceTask);

  const updateDraftName = useCallback((nodeId: string, name: string) => {
    setDraft((current) => updateNodeName(current, nodeId, name));
  }, []);

  const handleAddChild = useCallback((nodeId: string) => {
    setDraft((current) => addChildNode(current, nodeId));
  }, []);

  const handlePresetChildren = useCallback((nodeId: string, count: number) => {
    setDraft((current) => ensureChildCount(current, nodeId, count));
  }, []);

  const handleRemoveNode = useCallback((nodeId: string) => {
    setDraft((current) => removeNode(current, nodeId));
  }, []);

  const handleMoveNode = useCallback((nodeId: string, direction: -1 | 1) => {
    setDraft((current) => moveNode(current, nodeId, direction));
  }, []);

  const resetTool = useCallback(() => {
    setSourceMode('blank');
    setTarget('task');
    setDraft(createInitialDraft(''));
    setContext('Perso');
    setCategory('Autres');
    setTimeBudget('');
    sourceLinker.clear();
  }, [sourceLinker]);

  const createBranchTasks = useCallback(async (
    nodes: DivisionDraftNode[],
    level: 0 | 1 | 2,
    totalDuration: number,
    options: { parentId?: string; projectId?: string }
  ): Promise<Array<{ id: string; name: string; metadata: Record<string, unknown> }>> => {
    if (nodes.length === 0) return [];

    const durations = distributeDuration(totalDuration, nodes.length);
    const createdBranches: Array<{ id: string; name: string; metadata: Record<string, unknown> }> = [];

    for (const [index, node] of nodes.entries()) {
      const duration = durations[index] ?? 5;
      const created = await addTask({
        name: node.name.trim() || 'Sans titre',
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
      if (!createdId) {
        continue;
      }

      createdBranches.push({
        id: createdId,
        name: node.name.trim() || 'Sans titre',
        metadata: {
          category,
          context,
          estimatedTime: duration,
          duration,
          projectStatus: options.projectId ? 'todo' : undefined,
        },
      });

      if (node.children.length > 0 && level < DIVISION_MAX_DEPTH) {
        await createBranchTasks(node.children, (level + 1) as 1 | 2, duration, {
          parentId: createdId,
          projectId: options.projectId,
        });
      }
    }

    return createdBranches;
  }, [addTask, category, context]);

  const removeDirectChildren = useCallback(async (parentId: string) => {
    const directChildren = tasks.filter((task) => task.parentId === parentId);
    for (const child of directChildren) {
      await removeTask(child.id);
    }
  }, [tasks, removeTask]);

  const applyDraft = useCallback(async () => {
    if (!canApply) return;

    const rootName = draft.name.trim();
    const flags = eisenhowerFromCategory(category);

    if (sourceMode === 'existing' && selectedSourceTask) {
      const existingChildren = tasks.filter((task) => task.parentId === selectedSourceTask.id);
      if (existingChildren.length > 0) {
        const confirmed = window.confirm(
          target === 'project'
            ? `La structure actuelle de "${selectedSourceTask.name}" sera remplacée avant conversion en projet. Continuer ?`
            : `Les sous-tâches actuelles de "${selectedSourceTask.name}" seront remplacées. Continuer ?`
        );
        if (!confirmed) {
          return;
        }
      }
    }

    setIsApplying(true);
    try {
      if (sourceMode === 'existing' && selectedSourceTask && target === 'task') {
        await updateTask(selectedSourceTask.id, {
          name: rootName,
          category,
          context,
          estimatedTime: parsedTimeBudget,
          duration: parsedTimeBudget,
        });
        await removeDirectChildren(selectedSourceTask.id);
        await createBranchTasks(draft.children, 1, parsedTimeBudget, { parentId: selectedSourceTask.id });
      }

      if (sourceMode === 'blank' && target === 'task') {
        const createdRoot = await addTask({
          name: rootName,
          category,
          context,
          estimatedTime: parsedTimeBudget,
          duration: parsedTimeBudget,
          level: 0,
          isExpanded: true,
          isCompleted: false,
        } as Omit<Task, 'id' | 'createdAt'>);

        const rootId = (createdRoot as { id?: string } | undefined)?.id;
        if (rootId) {
          await createBranchTasks(draft.children, 1, parsedTimeBudget, { parentId: rootId });
        }
      }

      if (target === 'project') {
        const project = await createProject(
          rootName,
          undefined,
          '🧩',
          '#0f766e',
          context,
          flags.isImportant,
          flags.isUrgent
        );

        if (!project) {
          throw new Error('Impossible de créer le projet');
        }

        await createBranchTasks(draft.children, 0, parsedTimeBudget, { projectId: project.id });

        if (sourceMode === 'existing' && selectedSourceTask) {
          await removeDirectChildren(selectedSourceTask.id);
          await updateTask(selectedSourceTask.id, {
            isCompleted: true,
            name: rootName,
            category,
            context,
            estimatedTime: parsedTimeBudget,
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
        title: target === 'project' ? 'Structure appliquée au projet' : 'Structure appliquée à la tâche',
        description: target === 'project'
          ? 'La structure a été convertie en projet avec ses branches.'
          : 'La tâche a été structurée selon votre brouillon.',
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
    draft,
    category,
    context,
    sourceMode,
    selectedSourceTask,
    target,
    tasks,
    parsedTimeBudget,
    createProject,
    createBranchTasks,
    addTask,
    updateTask,
    removeDirectChildren,
    reloadTasks,
    reloadProjects,
    toast,
    resetTool,
  ]);

  return (
    <div className="space-y-6">
      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertTitle>Structurer avant d’appliquer</AlertTitle>
        <AlertDescription>
          Vous pouvez partir d’une page vide ou d’une tâche existante, réfléchir librement à la division, puis appliquer seulement quand la structure vous convient. L’outil respecte les contraintes actuelles de l’application : 3 branches max par nœud et 3 niveaux au total.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 xl:grid-cols-[24rem_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers3 className="w-5 h-5 text-primary" />
                Point de départ
              </CardTitle>
              <CardDescription>Choisissez si vous partez d’une structure vide ou d’une tâche déjà existante.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button variant={sourceMode === 'blank' ? 'default' : 'outline'} onClick={() => setSourceMode('blank')}>
                  Page vide
                </Button>
                <Button variant={sourceMode === 'existing' ? 'default' : 'outline'} onClick={() => setSourceMode('existing')}>
                  Tâche existante
                </Button>
              </div>

              {sourceMode === 'existing' && (
                <TaskLinker
                  mode="single"
                  max={1}
                  selectedTasks={sourceLinker.selectedTasks}
                  filteredAvailableTasks={selectableSourceTasks}
                  filteredCount={selectableSourceTasks.length}
                  totalCount={totalSelectableSourceTasks}
                  search={sourceLinker.filters.search}
                  contextFilter={sourceLinker.filters.context}
                  categoryFilter={sourceLinker.filters.category}
                  priorityFilter={sourceLinker.filters.priority}
                  canSelectMore={sourceLinker.canSelectMore}
                  onSelect={sourceLinker.select}
                  onDeselect={sourceLinker.deselect}
                  onSearchChange={sourceLinker.setSearch}
                  onContextFilterChange={sourceLinker.setContextFilter}
                  onCategoryFilterChange={sourceLinker.setCategoryFilter}
                  onPriorityFilterChange={sourceLinker.setPriorityFilter}
                  placeholder="Choisir une tâche racine..."
                  variant="inline"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-primary" />
                Paramètres racine
              </CardTitle>
              <CardDescription>Nom, contexte et budget de temps qui serviront de base à la structure appliquée.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="division-root-name">Nom racine</Label>
                <Input
                  id="division-root-name"
                  value={draft.name}
                  onChange={(event) => updateDraftName(draft.id, event.target.value)}
                  placeholder="Ex. Organiser la cuisine"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="division-context">Contexte</Label>
                  <Select value={context} onValueChange={(value) => setContext(value as TaskContext)}>
                    <SelectTrigger id="division-context">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTEXT_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="division-target">Appliquer comme</Label>
                  <Select value={target} onValueChange={(value) => setTarget(value as StructureTarget)}>
                    <SelectTrigger id="division-target">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="task">Tâche + sous-tâches</SelectItem>
                      <SelectItem value="project">Projet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="division-category">Catégorie des tâches créées</Label>
                  <Select value={category} onValueChange={(value) => setCategory(value as TaskCategory)}>
                    <SelectTrigger id="division-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>{CATEGORY_DISPLAY_NAMES[option]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="division-time-budget">Temps total de référence (min)</Label>
                  <Input
                    id="division-time-budget"
                    type="number"
                    min={1}
                    value={timeBudget}
                    onChange={(event) => setTimeBudget(event.target.value)}
                    placeholder="Ex. 90"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => handlePresetChildren(draft.id, 2)}>
                  Préparer un 2x2
                </Button>
                <Button variant="outline" onClick={() => handlePresetChildren(draft.id, 3)}>
                  Préparer un 3x3
                </Button>
                <Button variant="ghost" onClick={resetTool}>
                  Réinitialiser le brouillon
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranchPlus className="w-5 h-5 text-primary" />
                Éditeur de structure
              </CardTitle>
              <CardDescription>Ajoutez, retirez ou réorganisez les branches avant la validation finale.</CardDescription>
            </CardHeader>
            <CardContent>
              <DraftEditorNode
                node={draft}
                depth={0}
                index={0}
                siblingCount={1}
                onRename={updateDraftName}
                onAddChild={handleAddChild}
                onPresetChildren={handlePresetChildren}
                onRemove={handleRemoveNode}
                onMove={handleMoveNode}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Nœuds</div>
                <div className="text-3xl font-bold">{stats.nodes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Branches terminales</div>
                <div className="text-3xl font-bold">{stats.leaves}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Division racine</div>
                <div className="text-3xl font-bold">{stats.firstLevel}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Divide className="w-5 h-5 text-primary" />
                Résumé d’application
              </CardTitle>
              <CardDescription>
                {target === 'project'
                  ? 'La racine deviendra un projet, et les branches deviendront des tâches de projet.'
                  : 'La racine deviendra une tâche, et les branches deviendront des sous-tâches.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Source : {sourceMode === 'blank' ? 'Page vide' : 'Tâche existante'}</Badge>
                <Badge variant="outline">Cible : {target === 'project' ? 'Projet' : 'Tâche'}</Badge>
                <Badge variant="outline">Contexte : {context}</Badge>
                <Badge variant="outline">Catégorie : {CATEGORY_DISPLAY_NAMES[category]}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Le temps de référence sera réparti automatiquement entre les branches créées. Vous pourrez ensuite ajuster finement chaque durée dans l’application si besoin.
              </p>
              <Button onClick={applyDraft} disabled={!canApply || isApplying} className="w-full sm:w-auto">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {isApplying ? 'Application en cours...' : 'Appliquer la structure'}
              </Button>
              {!canApply && (
                <p className="text-xs text-muted-foreground">
                  Renseignez un nom racine, un temps total de référence, puis choisissez une tâche si vous partez d’un élément existant.
                </p>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="diagram" className="space-y-4">
            <TabsList>
              <TabsTrigger value="diagram">Diagramme</TabsTrigger>
              <TabsTrigger value="mermaid">Code Mermaid</TabsTrigger>
            </TabsList>

            <TabsContent value="diagram">
              <Card>
                <CardHeader>
                  <CardTitle>Vue d’ensemble</CardTitle>
                  <CardDescription>Une représentation visuelle pour vérifier rapidement l’équilibre de votre structure.</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto pb-6">
                  <div className="min-w-max flex justify-center px-4">
                    <DiagramBranch node={draft} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mermaid">
              <Card>
                <CardHeader>
                  <CardTitle>Code Mermaid compatible</CardTitle>
                  <CardDescription>Utile pour relire, partager ou préparer plus tard une aide IA sur cette structure.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea value={mermaidGraph} readOnly className="min-h-[260px] font-mono text-xs" />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Division33Tool;
