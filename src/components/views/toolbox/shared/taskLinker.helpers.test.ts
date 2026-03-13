import assert from 'node:assert/strict';
import test from 'node:test';
import type { Task } from '../../../../types/task';
import { buildTaskLinkerGroups, compareTaskLinkerTasks, inferTaskLinkerGroupBy } from './taskLinker.helpers.ts';

const baseTasks: Task[] = [
  {
    id: 'free-1',
    name: 'Acheter du pain',
    category: 'low_priority',
    context: 'Perso',
    estimatedTime: 10,
    level: 0,
    isCompleted: false,
    isExpanded: true,
    createdAt: new Date(),
  },
  {
    id: 'project-1-task',
    name: 'Faire la maquette',
    category: 'critical',
    context: 'Pro',
    estimatedTime: 90,
    level: 0,
    isCompleted: false,
    isExpanded: true,
    createdAt: new Date(),
    projectId: 'project-1',
    subCategory: 'Important',
  },
  {
    id: 'project-2-task',
    name: 'Appeler le client',
    category: 'urgent',
    context: 'Pro',
    estimatedTime: 30,
    level: 0,
    isCompleted: false,
    isExpanded: true,
    createdAt: new Date(),
    projectId: 'project-2',
    subCategory: 'Le plus important',
  },
];

test('inferTaskLinkerGroupBy keeps mixed/project/category logic stable', () => {
  assert.equal(inferTaskLinkerGroupBy({ search: '', scope: 'all', context: 'all', category: 'all', priority: 'all' }), 'mixed');
  assert.equal(inferTaskLinkerGroupBy({ search: '', scope: 'project', context: 'all', category: 'all', priority: 'all' }), 'project');
  assert.equal(inferTaskLinkerGroupBy({ search: '', scope: 'free', context: 'Pro', category: 'all', priority: 'all' }), 'category');
  assert.equal(inferTaskLinkerGroupBy({ search: '', scope: 'free', context: 'all', category: 'all', priority: 'Important' }), 'none');
});

test('buildTaskLinkerGroups resolves free tasks and project names', () => {
  const groups = buildTaskLinkerGroups(
    baseTasks,
    'mixed',
    new Map([
      ['project-1', 'Projet Alpha'],
      ['project-2', 'Projet Beta'],
    ])
  );

  assert.deepEqual(groups.map((group) => group.label), ['Taches libres', 'Projet Alpha', 'Projet Beta']);
  assert.equal(groups[1].tasks[0].id, 'project-1-task');
});

test('compareTaskLinkerTasks keeps priority sorting deterministic', () => {
  const sorted = [...baseTasks].sort((left, right) => compareTaskLinkerTasks(left, right, 'priority'));
  assert.deepEqual(sorted.map((task) => task.id), ['project-2-task', 'project-1-task', 'free-1']);
});

