import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockMutate = vi.fn();
vi.mock("swr", () => ({
  default: vi.fn(),
  useSWRConfig: () => ({ mutate: mockMutate }),
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { useProgressSaver } from "@/features/progress/model/use-progress-saver";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createSuccessResponse() {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: {} }),
  });
}

function createFailureResponse(status = 500) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error: "fail" }),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useProgressSaver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockFetch.mockImplementation(createSuccessResponse);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultOptions = {
    lessonId: "lesson-1",
    courseSlug: "test-course",
    initialPosition: 0,
    initialCompleted: false,
  };

  it("does not save position before 5 seconds elapsed", () => {
    const { result } = renderHook(() => useProgressSaver(defaultOptions));

    act(() => {
      result.current.handleTimeUpdate(10.5, 100);
    });

    // First call always saves (timestamp starts at 0)
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Advance less than 5 seconds
    vi.advanceTimersByTime(3000);

    act(() => {
      result.current.handleTimeUpdate(13.5, 100);
    });

    // Should NOT have saved again
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("saves position after 5-second interval", () => {
    const { result } = renderHook(() => useProgressSaver(defaultOptions));

    act(() => {
      result.current.handleTimeUpdate(10, 100);
    });

    // First save (timestamp was 0)
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith("/api/progress/lesson-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ position: 10 }),
    });

    // Advance 5 seconds
    vi.advanceTimersByTime(5000);

    act(() => {
      result.current.handleTimeUpdate(15.7, 100);
    });

    // Second save should happen
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenLastCalledWith("/api/progress/lesson-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ position: 15 }),
    });
  });

  it("truncates position to integer (Math.floor)", () => {
    const { result } = renderHook(() => useProgressSaver(defaultOptions));

    act(() => {
      result.current.handleTimeUpdate(42.9, 100);
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/progress/lesson-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ position: 42 }),
    });
  });

  it("auto-completes at 90% threshold", async () => {
    const { result } = renderHook(() => useProgressSaver(defaultOptions));

    // At 90% (90/100)
    await act(async () => {
      result.current.handleTimeUpdate(90, 100);
      // Wait for the async saveCompleted promise to resolve
      await vi.advanceTimersByTimeAsync(0);
    });

    // Should have two calls: one for position save and one for completed
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // The second call should be the completed save
    expect(mockFetch).toHaveBeenLastCalledWith("/api/progress/lesson-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true, position: 90 }),
    });

    // SWR should be revalidated
    expect(mockMutate).toHaveBeenCalledWith("/api/learn/test-course");

    // isCompleted should be true
    expect(result.current.isCompleted).toBe(true);
  });

  it("does not auto-complete twice (ref flag)", async () => {
    const { result } = renderHook(() => useProgressSaver(defaultOptions));

    // First time at 90%
    await act(async () => {
      result.current.handleTimeUpdate(90, 100);
      await vi.advanceTimersByTimeAsync(0);
    });

    const callCountAfterFirstAutoComplete = mockFetch.mock.calls.length;

    // Advance time to allow throttled save
    vi.advanceTimersByTime(5000);

    // Second time at 95% -- should NOT auto-complete again
    await act(async () => {
      result.current.handleTimeUpdate(95, 100);
      await vi.advanceTimersByTimeAsync(0);
    });

    // Only one additional call (position save), not two (no extra completed save)
    expect(mockFetch).toHaveBeenCalledTimes(callCountAfterFirstAutoComplete + 1);

    // The last call should be a position save, not a completed save
    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    const lastCallBody = JSON.parse(lastCall[1].body);
    expect(lastCallBody).toEqual({ position: 95 });
    expect(lastCallBody.completed).toBeUndefined();
  });

  it("manual complete sends completed: true and sets state", async () => {
    const { result } = renderHook(() => useProgressSaver(defaultOptions));

    await act(async () => {
      await result.current.manualComplete();
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/progress/lesson-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true, position: 0 }),
    });

    expect(mockMutate).toHaveBeenCalledWith("/api/learn/test-course");
    expect(result.current.isCompleted).toBe(true);
    expect(result.current.isSaving).toBe(false);
  });

  it("resets state when lessonId changes", async () => {
    const { result, rerender } = renderHook((props) => useProgressSaver(props), {
      initialProps: defaultOptions,
    });

    // Auto-complete on first lesson
    await act(async () => {
      result.current.handleTimeUpdate(95, 100);
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.isCompleted).toBe(true);
    mockFetch.mockClear();
    mockMutate.mockClear();

    // Switch to a different lesson
    rerender({
      lessonId: "lesson-2",
      courseSlug: "test-course",
      initialPosition: 30,
      initialCompleted: false,
    });

    // isCompleted should be reset
    expect(result.current.isCompleted).toBe(false);

    // Auto-complete should work on the new lesson
    await act(async () => {
      result.current.handleTimeUpdate(91, 100);
      await vi.advanceTimersByTimeAsync(0);
    });

    // Should send completed for the new lesson
    expect(mockFetch).toHaveBeenCalledWith("/api/progress/lesson-2", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true, position: 91 }),
    });
  });

  it("does not save when lessonId is undefined", () => {
    const { result } = renderHook(() =>
      useProgressSaver({
        ...defaultOptions,
        lessonId: undefined,
      }),
    );

    act(() => {
      result.current.handleTimeUpdate(50, 100);
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("does not auto-complete below 90% threshold", async () => {
    const { result } = renderHook(() => useProgressSaver(defaultOptions));

    await act(async () => {
      result.current.handleTimeUpdate(89, 100);
      await vi.advanceTimersByTimeAsync(0);
    });

    // Only position save, no completed save
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.completed).toBeUndefined();
  });

  it("handleEnded completes the lesson if not already completed", async () => {
    const { result } = renderHook(() => useProgressSaver(defaultOptions));

    await act(async () => {
      result.current.handleEnded();
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/progress/lesson-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true, position: 0 }),
    });

    expect(result.current.isCompleted).toBe(true);
    expect(mockMutate).toHaveBeenCalledWith("/api/learn/test-course");
  });

  it("handleEnded does not send if already completed", async () => {
    const { result } = renderHook(() =>
      useProgressSaver({
        ...defaultOptions,
        initialCompleted: true,
      }),
    );

    await act(async () => {
      result.current.handleEnded();
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("manual complete throws and sets isSaving=false on failure", async () => {
    mockFetch.mockImplementation(createFailureResponse);

    const { result } = renderHook(() => useProgressSaver(defaultOptions));

    await act(async () => {
      await expect(result.current.manualComplete()).rejects.toThrow();
    });

    expect(result.current.isSaving).toBe(false);
    expect(result.current.isCompleted).toBe(false);
  });
});
