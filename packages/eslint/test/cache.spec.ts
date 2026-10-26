import { createPathMemoizer } from "../src/common/cache.js";
import { describe, expect, it } from "vitest";

describe("createPathMemoizer", () => {
  it("caches by key and tracks hits", () => {
    const memo = createPathMemoizer((value: string) => value.toUpperCase());

    expect(memo.get("a")).toBe("A");
    expect(memo.get("a")).toBe("A");
    expect(memo.get("b")).toBe("B");

    expect(memo.stats).toEqual({ hits: 1, misses: 2 });
  });
});
