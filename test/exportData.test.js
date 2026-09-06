import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCategoryExportData, calculateCategoryTotals } from '../src/exportData.js';

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

test('distributes a shared category total equally between the other categories', () => {
  const categories = [
    { id: 'alberto', name: 'Alberto' },
    { id: 'kike', name: 'Kike' },
    { id: 'comun', name: 'Común', distributesTotal: true },
  ];
  const allocations = new Map([
    ['a', [{ id: 'alberto', pct: 100 }]],
    ['k', [{ id: 'kike', pct: 100 }]],
    ['c', [{ id: 'comun', pct: 100 }]],
  ]);
  const items = new Map([
    ['a', { amount: 20 }],
    ['k', { amount: 30 }],
    ['c', { amount: 10 }],
  ]);

  const totals = calculateCategoryTotals(categories, allocations, items);

  assert.equal(totals.alberto.ownTotal, 20);
  assert.equal(totals.alberto.distributedShare, 5);
  assert.equal(totals.alberto.finalTotal, 25);
  assert.deepEqual(totals.alberto.sourceNames, ['Común']);
  assert.equal(totals.kike.finalTotal, 35);
  assert.equal(totals.comun.ownTotal, 10);
  assert.equal(totals.comun.finalTotal, 10);
  assert.equal(totals.comun.recipientCount, 2);
});

test('combines multiple shared categories and keeps them out of the recipient count', () => {
  const categories = [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' },
    { id: 'food', name: 'Comida', distributesTotal: true },
    { id: 'home', name: 'Casa', distributesTotal: true },
  ];
  const allocations = new Map([
    ['food-item', [{ id: 'food', pct: 100 }]],
    ['home-item', [{ id: 'home', pct: 100 }]],
  ]);
  const items = new Map([
    ['food-item', { amount: 8 }],
    ['home-item', { amount: 4 }],
  ]);

  const totals = calculateCategoryTotals(categories, allocations, items);

  assert.equal(totals.a.distributedShare, 6);
  assert.equal(totals.b.distributedShare, 6);
  assert.equal(totals.food.recipientCount, 2);
  assert.equal(totals.home.recipientCount, 2);
});

test('distributes indivisible cents without losing money', () => {
  const categories = [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' },
    { id: 'c', name: 'C' },
    { id: 'shared', name: 'Común', distributesTotal: true },
  ];
  const allocations = new Map([
    ['shared-item', [{ id: 'shared', pct: 100 }]],
  ]);
  const items = new Map([
    ['shared-item', { amount: 10 }],
  ]);

  const totals = calculateCategoryTotals(categories, allocations, items);
  const shares = [totals.a, totals.b, totals.c].map((total) => total.distributedShare);

  assert.deepEqual(shares, [3.34, 3.33, 3.33]);
  assert.equal(shares.reduce((sum, amount) => sum + amount, 0), 10);
});
