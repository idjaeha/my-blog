import { describe, it, expect } from "vitest";
import { cn, formatDate, getReadingTime } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("resolves tailwind conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles undefined and null", () => {
    expect(cn("base", undefined, null)).toBe("base");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });

  it("merges array inputs", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });
});

describe("formatDate", () => {
  const date = new Date("2025-03-15");

  it("formats date in Korean locale by default", () => {
    const result = formatDate(date, "ko");
    expect(result).toContain("2025");
    expect(result).toContain("3");
    expect(result).toContain("15");
  });

  it("formats date in English locale", () => {
    const result = formatDate(date, "en");
    expect(result).toContain("2025");
    expect(result).toMatch(/March/);
    expect(result).toContain("15");
  });

  it("defaults to Korean locale", () => {
    const result = formatDate(date);
    expect(result).toBe(formatDate(date, "ko"));
  });
});

describe("getReadingTime", () => {
  it("returns minimum 1 minute for empty text (Korean)", () => {
    expect(getReadingTime("", "ko")).toBe(1);
  });

  it("returns minimum 1 minute for empty text (English)", () => {
    expect(getReadingTime("", "en")).toBe(1);
  });

  it("calculates Korean reading time at 500 chars/min", () => {
    const text = "가".repeat(1000); // 1000 chars -> 2 min
    expect(getReadingTime(text, "ko")).toBe(2);
  });

  it("calculates English reading time at 200 words/min", () => {
    const words = Array(400).fill("word").join(" "); // 400 words -> 2 min
    expect(getReadingTime(words, "en")).toBe(2);
  });

  it("rounds up to next minute (Korean)", () => {
    const text = "가".repeat(501); // 501 chars -> ceil(501/500) = 2
    expect(getReadingTime(text, "ko")).toBe(2);
  });

  it("rounds up to next minute (English)", () => {
    const words = Array(201).fill("word").join(" "); // 201 words -> ceil(201/200) = 2
    expect(getReadingTime(words, "en")).toBe(2);
  });

  it("ignores whitespace for Korean char count", () => {
    const text = "가 나 다".repeat(100); // spaces stripped
    const charCount = "가나다".repeat(100).length; // 300 chars
    expect(getReadingTime(text, "ko")).toBe(
      Math.max(1, Math.ceil(charCount / 500)),
    );
  });

  it("defaults to Korean locale", () => {
    const text = "가".repeat(500);
    expect(getReadingTime(text)).toBe(getReadingTime(text, "ko"));
  });
});
