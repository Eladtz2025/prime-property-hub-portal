import { describe, it, expect } from "vitest";

describe("CI smoke test", () => {
  it("should pass basic assertion", () => {
    expect(true).toBe(true);
  });
});
