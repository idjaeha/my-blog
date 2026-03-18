import { describe, it, expect } from "vitest";
import { SITE, PAGINATION, CATEGORIES } from "@/lib/constants";

describe("SITE", () => {
  it("has required properties", () => {
    expect(SITE).toHaveProperty("title");
    expect(SITE).toHaveProperty("description");
    expect(SITE).toHaveProperty("url");
    expect(SITE).toHaveProperty("author");
    expect(SITE).toHaveProperty("defaultLocale");
  });

  it("has string values", () => {
    expect(typeof SITE.title).toBe("string");
    expect(typeof SITE.url).toBe("string");
    expect(typeof SITE.author).toBe("object");
    expect(typeof SITE.author.name).toBe("string");
  });

  it("defaultLocale is ko", () => {
    expect(SITE.defaultLocale).toBe("ko");
  });
});

describe("PAGINATION", () => {
  it("has postsPerPage", () => {
    expect(PAGINATION.postsPerPage).toBe(10);
  });
});

describe("CATEGORIES", () => {
  it("has all expected categories", () => {
    expect(CATEGORIES).toHaveProperty("til");
    expect(CATEGORIES).toHaveProperty("retrospective");
    expect(CATEGORIES).toHaveProperty("article");
    expect(CATEGORIES).toHaveProperty("tutorial");
  });

  it("each category has ko and en labels", () => {
    for (const key of Object.keys(CATEGORIES) as (keyof typeof CATEGORIES)[]) {
      expect(CATEGORIES[key]).toHaveProperty("ko");
      expect(CATEGORIES[key]).toHaveProperty("en");
      expect(typeof CATEGORIES[key].ko).toBe("string");
      expect(typeof CATEGORIES[key].en).toBe("string");
    }
  });

  it("has correct Korean labels", () => {
    expect(CATEGORIES.til.ko).toBe("TIL");
    expect(CATEGORIES.retrospective.ko).toBe("회고");
    expect(CATEGORIES.article.ko).toBe("아티클");
    expect(CATEGORIES.tutorial.ko).toBe("튜토리얼");
  });

  it("has correct English labels", () => {
    expect(CATEGORIES.til.en).toBe("TIL");
    expect(CATEGORIES.retrospective.en).toBe("Retrospective");
    expect(CATEGORIES.article.en).toBe("Article");
    expect(CATEGORIES.tutorial.en).toBe("Tutorial");
  });
});
