export interface DivisionDraftNode {
  id: string;
  name: string;
  children: DivisionDraftNode[];
}

export const DIVISION_MAX_DEPTH = 2;
export const DIVISION_MAX_CHILDREN = 3;

const createNodeId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `draft-${Math.random().toString(36).slice(2, 10)}`;
};

export const createDraftNode = (name = ''): DivisionDraftNode => ({
  id: createNodeId(),
  name,
  children: [],
});

export const createInitialDraft = (name = ''): DivisionDraftNode => createDraftNode(name);

export const updateNodeName = (node: DivisionDraftNode, nodeId: string, name: string): DivisionDraftNode => {
  if (node.id === nodeId) {
    return { ...node, name };
  }

  return {
    ...node,
    children: node.children.map((child) => updateNodeName(child, nodeId, name)),
  };
};

export const addChildNode = (node: DivisionDraftNode, nodeId: string, depth = 0): DivisionDraftNode => {
  if (node.id === nodeId) {
    if (depth >= DIVISION_MAX_DEPTH || node.children.length >= DIVISION_MAX_CHILDREN) {
      return node;
    }

    return {
      ...node,
      children: [...node.children, createDraftNode('Nouvelle branche')],
    };
  }

  return {
    ...node,
    children: node.children.map((child) => addChildNode(child, nodeId, depth + 1)),
  };
};

export const ensureChildCount = (node: DivisionDraftNode, nodeId: string, targetCount: number, depth = 0): DivisionDraftNode => {
  if (node.id === nodeId) {
    if (depth >= DIVISION_MAX_DEPTH) {
      return node;
    }

    const boundedTarget = Math.max(0, Math.min(DIVISION_MAX_CHILDREN, targetCount));
    if (node.children.length >= boundedTarget) {
      return node;
    }

    const additions = Array.from({ length: boundedTarget - node.children.length }, (_, index) => (
      createDraftNode(`Branche ${node.children.length + index + 1}`)
    ));

    return {
      ...node,
      children: [...node.children, ...additions],
    };
  }

  return {
    ...node,
    children: node.children.map((child) => ensureChildCount(child, nodeId, targetCount, depth + 1)),
  };
};

export const removeNode = (node: DivisionDraftNode, nodeId: string): DivisionDraftNode => {
  return {
    ...node,
    children: node.children
      .filter((child) => child.id !== nodeId)
      .map((child) => removeNode(child, nodeId)),
  };
};

export const moveNode = (node: DivisionDraftNode, nodeId: string, direction: -1 | 1): DivisionDraftNode => {
  const index = node.children.findIndex((child) => child.id === nodeId);
  if (index >= 0) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= node.children.length) {
      return node;
    }

    const reorderedChildren = [...node.children];
    [reorderedChildren[index], reorderedChildren[nextIndex]] = [reorderedChildren[nextIndex], reorderedChildren[index]];
    return {
      ...node,
      children: reorderedChildren,
    };
  }

  return {
    ...node,
    children: node.children.map((child) => moveNode(child, nodeId, direction)),
  };
};

export const countNodes = (node: DivisionDraftNode): number => {
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
};

export const countLeaves = (node: DivisionDraftNode): number => {
  if (node.children.length === 0) {
    return 1;
  }

  return node.children.reduce((sum, child) => sum + countLeaves(child), 0);
};

export const buildMermaidGraph = (root: DivisionDraftNode): string => {
  const lines = ['graph LR'];

  const visit = (node: DivisionDraftNode) => {
    if (node.children.length > 0) {
      lines.push(`${node.id}[${escapeLabel(node.name || 'Sans titre')}] --> ${node.children.map((child) => `${child.id}[${escapeLabel(child.name || 'Sans titre')}]`).join(' & ')}`);
      node.children.forEach(visit);
    }
  };

  visit(root);

  return lines.join('\n');
};

const escapeLabel = (label: string) => {
  return label.replace(/\[/g, '(').replace(/\]/g, ')').replace(/"/g, "'");
};

export const distributeDuration = (totalDuration: number, count: number): number[] => {
  if (count <= 0) return [];

  const safeTotal = Math.max(totalDuration, count * 5);
  const base = Math.floor(safeTotal / count);
  const remainder = safeTotal % count;

  return Array.from({ length: count }, (_, index) => Math.max(5, base + (index < remainder ? 1 : 0)));
};

export const cloneTaskTree = <T extends { id: string; name: string }>(
  root: T,
  allTasks: Array<T & { parentId?: string; level: number }>
): DivisionDraftNode => {
  const buildNode = (task: T & { parentId?: string; level: number }): DivisionDraftNode => ({
    id: createNodeId(),
    name: task.name,
    children: allTasks
      .filter((candidate) => candidate.parentId === task.id)
      .map(buildNode),
  });

  return buildNode(root as T & { parentId?: string; level: number });
};
