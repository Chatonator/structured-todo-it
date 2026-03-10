export type DivisionSlotId =
  | 'root'
  | 'b1'
  | 'b2'
  | 'b3'
  | 'c1'
  | 'c2'
  | 'c3'
  | 'c4'
  | 'c5'
  | 'c6'
  | 'c7'
  | 'c8'
  | 'c9';

export interface DivisionSlot {
  id: DivisionSlotId;
  name: string;
  sourceTaskId?: string;
}

export interface DivisionDraftNode {
  id: string;
  name: string;
  sourceTaskId?: string;
  children: DivisionDraftNode[];
}

export const ROOT_SLOT_ID: DivisionSlotId = 'root';
export const FIRST_LEVEL_SLOT_IDS: DivisionSlotId[] = ['b1', 'b2', 'b3'];
export const SECOND_LEVEL_SLOT_IDS_BY_PARENT: Record<'b1' | 'b2' | 'b3', DivisionSlotId[]> = {
  b1: ['c1', 'c2', 'c3'],
  b2: ['c4', 'c5', 'c6'],
  b3: ['c7', 'c8', 'c9'],
};

export const ALL_SLOT_IDS: DivisionSlotId[] = [
  ROOT_SLOT_ID,
  ...FIRST_LEVEL_SLOT_IDS,
  ...SECOND_LEVEL_SLOT_IDS_BY_PARENT.b1,
  ...SECOND_LEVEL_SLOT_IDS_BY_PARENT.b2,
  ...SECOND_LEVEL_SLOT_IDS_BY_PARENT.b3,
];

export const createEmptySlots = (): Record<DivisionSlotId, DivisionSlot> => {
  return ALL_SLOT_IDS.reduce((accumulator, slotId) => {
    accumulator[slotId] = { id: slotId, name: '' };
    return accumulator;
  }, {} as Record<DivisionSlotId, DivisionSlot>);
};

export const updateSlot = (
  slots: Record<DivisionSlotId, DivisionSlot>,
  slotId: DivisionSlotId,
  updates: Partial<DivisionSlot>
): Record<DivisionSlotId, DivisionSlot> => ({
  ...slots,
  [slotId]: {
    ...slots[slotId],
    ...updates,
  },
});

export const clearSlotAndDescendants = (
  slots: Record<DivisionSlotId, DivisionSlot>,
  slotId: DivisionSlotId
): Record<DivisionSlotId, DivisionSlot> => {
  const next = { ...slots };
  const idsToClear = getDescendantSlotIds(slotId);

  idsToClear.forEach((id) => {
    next[id] = { id, name: '' };
  });

  return next;
};

export const getDescendantSlotIds = (slotId: DivisionSlotId): DivisionSlotId[] => {
  if (slotId === 'root') {
    return ALL_SLOT_IDS;
  }

  if (slotId === 'b1' || slotId === 'b2' || slotId === 'b3') {
    return [slotId, ...SECOND_LEVEL_SLOT_IDS_BY_PARENT[slotId]];
  }

  return [slotId];
};

export const buildDraftTree = (slots: Record<DivisionSlotId, DivisionSlot>): DivisionDraftNode => {
  const root = slots.root;

  return {
    id: root.id,
    name: root.name,
    sourceTaskId: root.sourceTaskId,
    children: FIRST_LEVEL_SLOT_IDS
      .map((slotId) => slots[slotId])
      .filter((slot) => slot.name.trim().length > 0)
      .map((slot) => ({
        id: slot.id,
        name: slot.name,
        sourceTaskId: slot.sourceTaskId,
        children: SECOND_LEVEL_SLOT_IDS_BY_PARENT[slot.id as 'b1' | 'b2' | 'b3']
          .map((childId) => slots[childId])
          .filter((childSlot) => childSlot.name.trim().length > 0)
          .map((childSlot) => ({
            id: childSlot.id,
            name: childSlot.name,
            sourceTaskId: childSlot.sourceTaskId,
            children: [],
          })),
      })),
  };
};

export const countFilledSlots = (slots: Record<DivisionSlotId, DivisionSlot>): number => {
  return ALL_SLOT_IDS.filter((slotId) => slots[slotId].name.trim().length > 0).length;
};

export const buildMermaidGraph = (slots: Record<DivisionSlotId, DivisionSlot>): string => {
  const tree = buildDraftTree(slots);
  const lines = ['graph LR'];

  if (!tree.name.trim()) {
    return lines.join('\n');
  }

  const visit = (node: DivisionDraftNode) => {
    if (node.children.length === 0) {
      return;
    }

    lines.push(`${node.id}[${escapeLabel(node.name)}] --> ${node.children.map((child) => `${child.id}[${escapeLabel(child.name)}]`).join(' & ')}`);
    node.children.forEach(visit);
  };

  visit(tree);
  return lines.join('\n');
};

const escapeLabel = (label: string) => label.replace(/\[/g, '(').replace(/\]/g, ')').replace(/"/g, "'");

export const distributeDuration = (totalDuration: number, count: number): number[] => {
  if (count <= 0) return [];

  const safeTotal = Math.max(totalDuration, count * 5);
  const base = Math.floor(safeTotal / count);
  const remainder = safeTotal % count;

  return Array.from({ length: count }, (_, index) => Math.max(5, base + (index < remainder ? 1 : 0)));
};

export const hydrateSlotsFromTaskTree = <T extends { id: string; name: string; parentId?: string }>(
  rootTask: T,
  allTasks: T[]
): Record<DivisionSlotId, DivisionSlot> => {
  const slots = createEmptySlots();
  slots.root = {
    id: 'root',
    name: rootTask.name,
    sourceTaskId: rootTask.id,
  };

  const firstLevelTasks = allTasks.filter((task) => task.parentId === rootTask.id).slice(0, 3);

  firstLevelTasks.forEach((task, index) => {
    const slotId = FIRST_LEVEL_SLOT_IDS[index];
    slots[slotId] = {
      id: slotId,
      name: task.name,
      sourceTaskId: task.id,
    };

    const secondLevelTasks = allTasks
      .filter((candidate) => candidate.parentId === task.id)
      .slice(0, 3);

    secondLevelTasks.forEach((childTask, childIndex) => {
      const childSlotId = SECOND_LEVEL_SLOT_IDS_BY_PARENT[slotId][childIndex];
      slots[childSlotId] = {
        id: childSlotId,
        name: childTask.name,
        sourceTaskId: childTask.id,
      };
    });
  });

  return slots;
};
