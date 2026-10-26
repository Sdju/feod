import { describe, expect, it } from "vitest";

import { strict } from "../src/modules/ProjectConfig/index.js";

describe("strict config", () => {
  it("enables visibility-levels rule", () => {
    expect(strict.rules?.["feod-structure/visibility-levels"]).toBe("error");
  });
});
