export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const arr = [...items];
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  for (let i = arr.length - 1; i > 0; i--) {
    h ^= h >>> 16;
    h = Math.imul(h, 2246822519);
    h >>>= 0;
    const j = h % (i + 1);
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

export function shuffleOrder(items: readonly string[], seed: string): string[] {
  const next = seededShuffle(items, seed);
  if (next.every((item, i) => item === items[i])) {
    return [...items.slice(1), items[0]!];
  }
  return next;
}

export function pickN<T>(items: readonly T[], n: number, seed: string): T[] {
  return seededShuffle(items, seed).slice(0, Math.min(n, items.length));
}
