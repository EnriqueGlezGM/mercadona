import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCategoryExportData } from '../src/exportData.js';

test('keeps negative promotion lines in category exports', () => {
  const categories = [{ id: 'comun', name: 'Común' }];
  const allocations = new Map([
    ['product-1', [{ id: 'comun', pct: 100 }]],
    ['promo-1', [{ id: 'comun', pct: 100 }]],
  ]);
  const items = new Map([
    ['product-1', { id: 'product-1', description: 'MOZZARELLA RALLADO', amount: 1.95 }],
    ['promo-1', { id: 'promo-1', description: 'PROMO LIDL PLUS', amount: -0.29 }],
  ]);

  const result = buildCategoryExportData(categories, allocations, items);

  assert.equal(result.comun.length, 2);
  assert.deepEqual(result.comun.map((item) => item.amount), [1.95, -0.29]);
});

test('keeps a negative amount when it is split between categories', () => {
  const categories = [{ id: 'alberto' }, { id: 'kike' }];
  const allocations = new Map([
    ['promo-1', [
      { id: 'alberto', pct: 40 },
      { id: 'kike', pct: 60 },
    ]],
  ]);
  const items = new Map([
    ['promo-1', { id: 'promo-1', description: 'PROMOCIÓN', amount: -1 }],
  ]);

  const result = buildCategoryExportData(categories, allocations, items);

  assert.equal(result.alberto[0].amount, -0.4);
  assert.equal(result.kike[0].amount, -0.6);
});
