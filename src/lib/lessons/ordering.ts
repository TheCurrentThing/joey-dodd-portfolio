type OrderedItem = {
  id: string;
  sort_order: number;
};

function assignSequentialSortOrder<T extends OrderedItem>(items: T[]) {
  return items.map((item, index) => ({
    ...item,
    sort_order: index,
  }));
}

export function sortBySortOrder<T extends OrderedItem>(items: T[]) {
  return [...items].sort((left, right) => {
    if (left.sort_order === right.sort_order) {
      return left.id.localeCompare(right.id);
    }

    return left.sort_order - right.sort_order;
  });
}

export function normalizeSortOrder<T extends OrderedItem>(items: T[]) {
  return assignSequentialSortOrder(sortBySortOrder(items));
}

export function moveOrderedItem<T extends OrderedItem>(items: T[], from: number, to: number) {
  const ordered = normalizeSortOrder(items);
  const boundedTo = Math.max(0, Math.min(to, ordered.length - 1));
  const boundedFrom = Math.max(0, Math.min(from, ordered.length - 1));

  if (boundedFrom === boundedTo) {
    return ordered;
  }

  const next = [...ordered];
  const [item] = next.splice(boundedFrom, 1);
  next.splice(boundedTo, 0, item);

  return assignSequentialSortOrder(next);
}

export function duplicateOrderedItem<T extends OrderedItem>(
  items: T[],
  targetId: string,
  createDuplicate: (item: T) => T
) {
  const ordered = normalizeSortOrder(items);
  const index = ordered.findIndex((item) => item.id === targetId);
  if (index === -1) {
    return ordered;
  }

  const next = [...ordered];
  next.splice(index + 1, 0, createDuplicate(ordered[index]));
  return assignSequentialSortOrder(next);
}
