import assert from 'node:assert/strict';
import test from 'node:test';
import { getAppearanceDataset, getCategoryCssVariables, toHslTriplet } from './colorUtils';

test('getAppearanceDataset maps preferences to stable DOM attributes', () => {
  assert.deepEqual(
    getAppearanceDataset('dark', {
      textSize: 'large',
      highContrast: true,
      reducedAnimations: true,
    }),
    {
      theme: 'dark',
      textSize: 'large',
      contrast: 'high',
      motion: 'reduced',
    }
  );
});

test('toHslTriplet converts hex colors to hsl triplets', () => {
  assert.equal(toHslTriplet('#ef4444'), '0 84% 60%');
});

test('toHslTriplet resolves css variable references', () => {
  assert.equal(
    toHslTriplet('hsl(var(--destructive))', (name) => (name === 'destructive' ? '0 72% 51%' : null)),
    '0 72% 51%'
  );
});

test('getCategoryCssVariables generates base and surface variants', () => {
  const result = getCategoryCssVariables(
    {
      critical: '#ef4444',
      urgent: '#eab308',
      important: '#22c55e',
      low_priority: '#3b82f6',
    },
    false
  );

  assert.equal(result['--category-critical'], '0 84% 60%');
  assert.equal(result['--category-urgent'], '45 93% 47%');
  assert.equal(result['--category-important'], '142 71% 45%');
  assert.equal(result['--category-low-priority'], '217 91% 60%');
  assert.ok(result['--category-critical-light']);
  assert.ok(result['--category-low-priority-light']);
});

