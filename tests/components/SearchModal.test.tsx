// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
} from "@testing-library/react";
import SearchModal from "@/components/islands/SearchModal";

describe("SearchModal", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders search button", () => {
    render(<SearchModal locale="ko" />);
    const button = screen.getByRole("button", { name: /open search/i });
    expect(button).toBeDefined();
  });

  it("shows Korean label for ko locale", () => {
    render(<SearchModal locale="ko" />);
    expect(screen.getByText("검색")).toBeDefined();
  });

  it("shows English label for en locale", () => {
    render(<SearchModal locale="en" />);
    expect(screen.getByText("Search")).toBeDefined();
  });

  it("opens modal on button click", async () => {
    render(<SearchModal locale="ko" />);

    await act(() => {
      fireEvent.click(screen.getByRole("button", { name: /open search/i }));
    });

    expect(screen.getByRole("dialog")).toBeDefined();
  });

  it("opens modal on Cmd+K", async () => {
    render(<SearchModal locale="ko" />);

    await act(() => {
      fireEvent.keyDown(document, { key: "k", metaKey: true });
    });

    expect(screen.getByRole("dialog")).toBeDefined();
  });

  it("opens modal on Ctrl+K", async () => {
    render(<SearchModal locale="ko" />);

    await act(() => {
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    });

    expect(screen.getByRole("dialog")).toBeDefined();
  });

  it("shows Korean placeholder in modal", async () => {
    render(<SearchModal locale="ko" />);

    await act(() => {
      fireEvent.click(screen.getByRole("button", { name: /open search/i }));
    });

    const input = screen.getByRole("searchbox");
    expect(input.getAttribute("placeholder")).toBe(
      "글 제목이나 내용을 검색하세요...",
    );
  });

  it("shows English placeholder in modal", async () => {
    render(<SearchModal locale="en" />);

    await act(() => {
      fireEvent.click(screen.getByRole("button", { name: /open search/i }));
    });

    const input = screen.getByRole("searchbox");
    expect(input.getAttribute("placeholder")).toBe("Search posts...");
  });

  it("has keyboard shortcut hint", () => {
    render(<SearchModal locale="ko" />);
    expect(screen.getByText("K")).toBeDefined();
  });
});
