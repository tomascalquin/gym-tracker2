import { describe, expect, it } from "vitest";
import { calcFatigue } from "./intelligence";

describe("calcFatigue", () => {
  it("returns low fatigue for empty logs", () => {
    const result = calcFatigue({});
    expect(result.fatigueLevel).toBe("low");
    expect(result.sessionCount).toBe(0);
  });
});
