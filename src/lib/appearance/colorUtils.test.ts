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
  assert.equal(toHslTriplet('#dc2626'), '0 72% 51%');
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
      Obligation: '#dc2626',
      Quotidien: '#d97706',
      Envie: '#16a34a',
      Autres: '#8b5cf6',
    },
    false
  );

  assert.equal(result['--category-obligation'], '0 72% 51%');
  assert.ok(result['--category-obligation-light']);
  assert.ok(result['--category-autres-light']);
});
