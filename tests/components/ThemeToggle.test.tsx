// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
} from "@testing-library/react";
import ThemeToggle from "@/components/islands/ThemeToggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
      })),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders a toggle button", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toBeDefined();
  });

  it("has accessible aria-label", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).toMatch(
      /switch to (light|dark) mode/i,
    );
  });

  it("defaults to light mode when no preference stored", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).toBe("Switch to dark mode");
  });

  it("reads stored theme from localStorage", () => {
    localStorage.setItem("theme", "dark");

    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).toBe("Switch to light mode");
  });

  it("toggles from light to dark", async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");

    await act(() => {
      fireEvent.click(button);
    });

    expect(button.getAttribute("aria-label")).toBe("Switch to light mode");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("toggles from dark to light", async () => {
    localStorage.setItem("theme", "dark");

    render(<ThemeToggle />);
    const button = screen.getByRole("button");

    await act(() => {
      fireEvent.click(button);
    });

    expect(button.getAttribute("aria-label")).toBe("Switch to dark mode");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("persists theme to localStorage", async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");

    await act(() => {
      fireEvent.click(button);
    });

    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("adds dark class to documentElement in dark mode", async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");

    await act(() => {
      fireEvent.click(button);
    });

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("respects system dark mode preference", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
      })),
    });

    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).toBe("Switch to light mode");
  });
});
