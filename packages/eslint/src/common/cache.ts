export type CacheStats = {
  hits: number;
  misses: number;
};

export type PathMemoizer<T> = {
  get: (key: string) => T;
  clear: () => void;
  stats: CacheStats;
};

export function createPathMemoizer<T>(fn: (key: string) => T): PathMemoizer<T> {
  const cache = new Map<string, T>();
  const stats: CacheStats = { hits: 0, misses: 0 };

  return {
    get(key: string) {
      if (cache.has(key)) {
        stats.hits += 1;
        return cache.get(key)!;
      }
      const value = fn(key);
      cache.set(key, value);
      stats.misses += 1;
      return value;
    },
    clear() {
      cache.clear();
      stats.hits = 0;
      stats.misses = 0;
    },
    stats,
  };
}
