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
