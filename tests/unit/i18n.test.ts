import { describe, it, expect } from "vitest";
import {
  getLocaleFromUrl,
  t,
  getLocalizedPath,
  defaultLocale,
  type Locale,
} from "@/i18n/index";

describe("defaultLocale", () => {
  it("is ko", () => {
    expect(defaultLocale).toBe("ko");
  });
});

describe("getLocaleFromUrl", () => {
  it("returns en for English paths", () => {
    expect(getLocaleFromUrl(new URL("https://example.com/en/blog"))).toBe("en");
  });

  it("returns ko for Korean paths (no prefix)", () => {
    expect(getLocaleFromUrl(new URL("https://example.com/blog"))).toBe("ko");
  });

  it("returns ko for root path", () => {
    expect(getLocaleFromUrl(new URL("https://example.com/"))).toBe("ko");
  });

  it("returns en for /en root", () => {
    expect(getLocaleFromUrl(new URL("https://example.com/en"))).toBe("en");
  });

  it("returns ko for unknown locale prefix", () => {
    expect(getLocaleFromUrl(new URL("https://example.com/fr/blog"))).toBe("ko");
  });

  it("returns en for deeply nested English paths", () => {
    expect(
      getLocaleFromUrl(new URL("https://example.com/en/blog/my-post")),
    ).toBe("en");
  });
});

describe("t", () => {
  it("returns Korean translation for ko locale", () => {
    expect(t("nav.home", "ko")).toBe("홈");
  });

  it("returns English translation for en locale", () => {
    expect(t("nav.home", "en")).toBe("Home");
  });

  it("returns the key itself when translation is missing", () => {
    expect(t("nonexistent.key", "ko")).toBe("nonexistent.key");
    expect(t("nonexistent.key", "en")).toBe("nonexistent.key");
  });

  it("translates blog-related keys correctly", () => {
    expect(t("blog.readMore", "ko")).toBe("더 읽기");
    expect(t("blog.readMore", "en")).toBe("Read more");
  });

  it("translates search-related keys correctly", () => {
    expect(t("search.placeholder", "ko")).toBe("검색어를 입력하세요...");
    expect(t("search.placeholder", "en")).toBe("Search...");
  });

  it("translates footer keys correctly", () => {
    expect(t("footer.rights", "ko")).toBe("All rights reserved.");
    expect(t("footer.rights", "en")).toBe("All rights reserved.");
  });
});

describe("getLocalizedPath", () => {
  it("returns path as-is for Korean locale", () => {
    expect(getLocalizedPath("/blog", "ko")).toBe("/blog");
  });

  it("prepends /en for English locale", () => {
    expect(getLocalizedPath("/blog", "en")).toBe("/en/blog");
  });

  it("handles root path for Korean", () => {
    expect(getLocalizedPath("/", "ko")).toBe("/");
  });

  it("handles root path for English", () => {
    expect(getLocalizedPath("/", "en")).toBe("/en/");
  });

  it("handles nested paths", () => {
    expect(getLocalizedPath("/blog/my-post", "en")).toBe("/en/blog/my-post");
  });
});
