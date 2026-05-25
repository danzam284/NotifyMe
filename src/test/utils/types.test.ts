import { describe, expect, it } from "bun:test";
import { intervalToMs } from "../../utils/types";


describe("intervalToMs", () => {
  it("converts 1_HOUR correctly", () => {
    expect(intervalToMs("1_HOUR")).toBe(60 * 60 * 1000);
  });

  it("converts 6_HOURS correctly", () => {
    expect(intervalToMs("6_HOURS")).toBe(6 * 60 * 60 * 1000);
  });

  it("converts 12_HOURS correctly", () => {
    expect(intervalToMs("12_HOURS")).toBe(12 * 60 * 60 * 1000);
  });

  it("converts 1_DAY correctly", () => {
    expect(intervalToMs("1_DAY")).toBe(24 * 60 * 60 * 1000);
  });

  it("converts 1_WEEK correctly", () => {
    expect(intervalToMs("1_WEEK")).toBe(
      7 * 24 * 60 * 60 * 1000
    );
  });
});
