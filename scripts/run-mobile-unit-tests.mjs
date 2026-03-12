import assert from 'node:assert/strict';
import { PHONE_MAX_WIDTH, TABLET_MAX_WIDTH, getLayoutMode, isCompactLayout } from '../src/lib/layout/layoutMode.ts';
import { getMobileViewIdsByPlacement, isPrimaryMobileViewId, mobileViewConfig } from '../src/components/routing/mobileViewConfig.ts';
import { buildTaskLinkerGroups, compareTaskLinkerTasks, inferTaskLinkerGroupBy } from '../src/components/views/toolbox/shared/taskLinker.helpers.ts';
import { DEFAULT_DASHBOARD_LAYOUT, WIDGET_REGISTRY } from '../src/types/widget.ts';
import { normalizeTaskRulePreferences } from '../src/types/taskRules.ts';
import { createNextStaleTaskRuleState, evaluateStaleTaskRule } from '../src/lib/task-rules/engine.ts';

const staleTaskRuleSettings = {
  enabled: true,
  firstAlertAfterDays: 7,
  repeatEveryDays: 7,
  autoActionAfterAlerts: 3,
  autoAction: 'pin',
};

const cases = [
  ['task rule preferences stay normalized when older partial values are loaded', () => {
    const normalized = normalizeTaskRulePreferences({ staleTask: { enabled: true, firstAlertAfterDays: 9 } });
    assert.equal(normalized.staleTask.enabled, true);
    assert.equal(normalized.staleTask.firstAlertAfterDays, 9);
    assert.equal(normalized.staleTask.repeatEveryDays, 7);
    assert.equal(normalized.staleTask.autoAction, 'pin');
  }],
  ['stale task rule triggers a second alert and keeps auto action pending', () => {
    const outcome = evaluateStaleTaskRule(
      {
        id: 'task-1',
        name: 'Préparer le dossier',
        contextType: 'task',
        parentId: null,
        metadata: { ruleAlerts: { staleTask: { alertCount: 1 } } },
        orderIndex: 0,
        isCompleted: false,
        isPinned: false,
        createdAt: new Date('2026-03-01T10:00:00.000Z'),
        updatedAt: new Date('2026-03-01T10:00:00.000Z'),
        userId: 'user-1',
      },
      new Date('2026-03-15T10:00:00.000Z'),
      staleTaskRuleSettings
    );

    assert.ok(outcome);
    assert.equal(outcome.shouldCreateAlert, true);
    assert.equal(outcome.nextAlertCount, 2);
    assert.equal(outcome.shouldApplyAutoAction, false);
  }],
  ['stale task rule applies the automatic action on the threshold alert', () => {
    const outcome = evaluateStaleTaskRule(
      {
        id: 'task-1',
        name: 'Préparer le dossier',
        contextType: 'task',
        parentId: null,
        metadata: { ruleAlerts: { staleTask: { alertCount: 2 } } },
        orderIndex: 0,
        isCompleted: false,
        isPinned: false,
        createdAt: new Date('2026-03-01T10:00:00.000Z'),
        updatedAt: new Date('2026-03-01T10:00:00.000Z'),
        userId: 'user-1',
      },
      new Date('2026-03-22T10:00:00.000Z'),
      staleTaskRuleSettings
    );

    assert.ok(outcome);

    const state = createNextStaleTaskRuleState(
      { alertCount: 2 },
      outcome,
      staleTaskRuleSettings,
      new Date('2026-03-22T10:00:00.000Z')
    );

    assert.equal(outcome.shouldCreateAlert, true);
    assert.equal(outcome.shouldApplyAutoAction, true);
    assert.equal(state.alertCount, 3);
    assert.equal(typeof state.autoActionAppliedAt, 'string');
  }],
  ['task linker grouping resolves project names and free tasks', () => {
    const tasks = [
      { id: 'free-1', name: 'Acheter du pain', category: 'Autres', context: 'Perso', estimatedTime: 10, level: 0, isCompleted: false, isExpanded: true, createdAt: new Date() },
      { id: 'project-1-task', name: 'Faire la maquette', category: 'Obligation', context: 'Pro', estimatedTime: 90, level: 0, isCompleted: false, isExpanded: true, createdAt: new Date(), projectId: 'project-1', subCategory: 'Important' },
    ];
    const groups = buildTaskLinkerGroups(tasks, 'mixed', new Map([['project-1', 'Projet Alpha']]));
    assert.deepEqual(groups.map((group) => group.label), ['Taches libres', 'Projet Alpha']);
  }],
  ['task linker helper keeps grouping strategy stable', () => {
    assert.equal(inferTaskLinkerGroupBy({ search: '', scope: 'all', context: 'all', category: 'all', priority: 'all' }), 'mixed');
    assert.equal(inferTaskLinkerGroupBy({ search: '', scope: 'project', context: 'all', category: 'all', priority: 'all' }), 'project');
  }],
  ['task linker helper keeps priority sorting deterministic', () => {
    const tasks = [
      { id: 'a', name: 'A', category: 'Autres', context: 'Perso', estimatedTime: 10, level: 0, isCompleted: false, isExpanded: true, createdAt: new Date() },
      { id: 'b', name: 'B', category: 'Obligation', context: 'Pro', estimatedTime: 20, level: 0, isCompleted: false, isExpanded: true, createdAt: new Date(), subCategory: 'Important' },
      { id: 'c', name: 'C', category: 'Quotidien', context: 'Pro', estimatedTime: 30, level: 0, isCompleted: false, isExpanded: true, createdAt: new Date(), subCategory: 'Le plus important' },
    ];
    const sorted = [...tasks].sort((left, right) => compareTaskLinkerTasks(left, right, 'priority'));
    assert.deepEqual(sorted.map((task) => task.id), ['c', 'b', 'a']);
  }],
  ['dashboard default layout exposes the main widgets', () => {
    const ids = DEFAULT_DASHBOARD_LAYOUT.widgets.map((widget) => widget.id);
    assert.equal(ids.includes('daily-overview'), true);
    assert.equal(ids.includes('quick-links'), true);
    assert.equal(ids.length >= 8, true);
  }],
  ['dashboard widget registry stays aligned with the richer home page', () => {
    assert.equal(Object.keys(WIDGET_REGISTRY).length, 9);
    assert.equal(WIDGET_REGISTRY['team-snapshot'].sourceView, 'team');
  }],
  ['getLayoutMode returns phone through the phone breakpoint', () => {
    assert.equal(getLayoutMode(0), 'phone');
    assert.equal(getLayoutMode(PHONE_MAX_WIDTH), 'phone');
  }],
  ['getLayoutMode returns tablet-compact between phone and desktop breakpoints', () => {
    assert.equal(getLayoutMode(PHONE_MAX_WIDTH + 1), 'tablet-compact');
    assert.equal(getLayoutMode(TABLET_MAX_WIDTH), 'tablet-compact');
  }],
  ['getLayoutMode returns desktop after the tablet breakpoint', () => {
    assert.equal(getLayoutMode(TABLET_MAX_WIDTH + 1), 'desktop');
  }],
  ['isCompactLayout stays true for phone and tablet but false for desktop', () => {
    assert.equal(isCompactLayout(390), true);
    assert.equal(isCompactLayout(768), true);
    assert.equal(isCompactLayout(1280), false);
  }],
  ['primary mobile views stay focused on the daily flow', () => {
    assert.deepEqual(getMobileViewIdsByPlacement('primary'), ['home', 'tasks', 'timeline', 'habits']);
  }],
  ['secondary mobile views are ordered inside the more sheet', () => {
    assert.deepEqual(getMobileViewIdsByPlacement('more'), ['projects', 'observatory', 'rewards', 'toolbox', 'team']);
  }],
  ['primary mobile lookup only marks the main tab views', () => {
    assert.equal(isPrimaryMobileViewId('tasks'), true);
    assert.equal(isPrimaryMobileViewId('projects'), false);
    assert.equal(isPrimaryMobileViewId('unknown'), false);
  }],
  ['mobile support flags remain explicit for every registered mobile view', () => {
    assert.equal(mobileViewConfig.home.support, 'optimized');
    assert.equal(mobileViewConfig.projects.support, 'simplified');
    assert.equal(Object.keys(mobileViewConfig).length, 9);
  }],
];

let failures = 0;

for (const [name, run] of cases) {
  try {
    run();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}`);
    console.error(error);
  }
}

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log(`All ${cases.length} mobile unit checks passed.`);
}
