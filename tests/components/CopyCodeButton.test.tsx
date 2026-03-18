// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { screen, fireEvent } from "@testing-library/dom";
import CopyCodeButton from "@/components/islands/CopyCodeButton";

const mockWriteText = vi.fn().mockResolvedValue(undefined);

vi.stubGlobal("navigator", {
  ...navigator,
  clipboard: {
    writeText: mockWriteText,
  },
});

describe("CopyCodeButton", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    mockWriteText.mockClear();
  });

  it("renders a copy button", () => {
    render(<CopyCodeButton />);
    const button = screen.getByRole("button", { name: /copy code/i });
    expect(button).toBeDefined();
  });

  it("has accessible aria-label", () => {
    render(<CopyCodeButton />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).toBe("Copy code");
  });

  it("shows 'Copied' after successful copy", async () => {
    const code = document.createElement("code");
    code.textContent = "const x = 1;";

    vi.spyOn(document, "querySelector").mockReturnValue(code);

    render(<CopyCodeButton />);
    const button = screen.getByRole("button");

    await act(async () => {
      fireEvent.click(button);
    });

    expect(button.getAttribute("aria-label")).toBe("Copied");
  });

  it("copies code block text content", async () => {
    const code = document.createElement("code");
    code.textContent = "console.log('hello');";

    vi.spyOn(document, "querySelector").mockReturnValue(code);

    render(<CopyCodeButton />);
    const button = screen.getByRole("button");

    await act(async () => {
      fireEvent.click(button);
    });

    expect(mockWriteText).toHaveBeenCalledWith("console.log('hello');");
  });

  it("does nothing when no code block is found", async () => {
    vi.spyOn(document, "querySelector").mockReturnValue(null);

    render(<CopyCodeButton />);
    const button = screen.getByRole("button");

    await act(async () => {
      fireEvent.click(button);
    });

    expect(mockWriteText).not.toHaveBeenCalled();
    expect(button.getAttribute("aria-label")).toBe("Copy code");
  });

  it("reverts to 'Copy code' after timeout", async () => {
    vi.useFakeTimers();

    const code = document.createElement("code");
    code.textContent = "test";
    vi.spyOn(document, "querySelector").mockReturnValue(code);

    render(<CopyCodeButton />);
    const button = screen.getByRole("button");

    await act(async () => {
      fireEvent.click(button);
    });

    expect(button.getAttribute("aria-label")).toBe("Copied");

    await act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(button.getAttribute("aria-label")).toBe("Copy code");

    vi.useRealTimers();
  });
});
