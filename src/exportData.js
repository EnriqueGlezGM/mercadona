export function buildCategoryExportData(categories, allocationMap, itemsByKey) {
  const byCategory = {};
  for (const category of categories || []) byCategory[category.id] = [];

  for (const [key, allocations] of allocationMap || []) {
    const item = itemsByKey.get(key);
    if (!item) continue;

    const amount = Number(item.amount);
    if (!Number.isFinite(amount)) continue;

    for (const allocation of allocations || []) {
      if (!byCategory[allocation.id]) continue;
      const partAmount = amount * (Number(allocation.pct) || 0) / 100;
      if (!Number.isFinite(partAmount) || partAmount === 0) continue;
      byCategory[allocation.id].push({
        ...item,
        amount: partAmount,
        pct: allocation.pct,
      });
    }
  }

  return byCategory;
}

export function calculateCategoryTotals(categories, allocationMap, itemsByKey) {
  const totals = {};
  for (const category of categories || []) {
    totals[category.id] = {
      count: 0,
      ownTotal: 0,
      distributedShare: 0,
      finalTotal: 0,
      distributesTotal: !!category.distributesTotal,
      recipientCount: 0,
      sourceNames: [],
    };
  }

  for (const [key, allocations] of allocationMap || []) {
    const item = itemsByKey.get(key);
    if (!item) continue;
    const amount = Number(item.amount);
    if (!Number.isFinite(amount)) continue;

    for (const allocation of allocations || []) {
      const total = totals[allocation.id];
      if (!total) continue;
      const percentage = Number(allocation.pct);
      if (!Number.isFinite(percentage) || percentage <= 0) continue;
      total.count += 1;
      total.ownTotal += amount * percentage / 100;
    }
  }

  const sourceCategories = (categories || []).filter((category) => category.distributesTotal);
  const recipientCategories = (categories || []).filter((category) => !category.distributesTotal);
  const distributedTotal = sourceCategories.reduce(
    (sum, category) => sum + (totals[category.id]?.ownTotal || 0),
    0,
  );
  const totalCents = Math.round(distributedTotal * 100);
  const baseShareCents = recipientCategories.length
    ? Math.trunc(totalCents / recipientCategories.length)
    : 0;
  const remainderCents = recipientCategories.length
    ? totalCents - (baseShareCents * recipientCategories.length)
    : 0;
  const sourceNames = sourceCategories.map((category) => category.name).filter(Boolean);

  let recipientIndex = 0;
  for (const category of categories || []) {
    const total = totals[category.id];
    if (!total) continue;
    if (category.distributesTotal) {
      total.recipientCount = recipientCategories.length;
      total.finalTotal = total.ownTotal;
    } else {
      const receivesRemainderCent = recipientIndex < Math.abs(remainderCents);
      const remainderAdjustment = receivesRemainderCent ? Math.sign(remainderCents) : 0;
      total.distributedShare = (baseShareCents + remainderAdjustment) / 100;
      total.finalTotal = total.ownTotal + total.distributedShare;
      total.sourceNames = sourceNames.slice();
      recipientIndex += 1;
    }
  }

  return totals;
}
