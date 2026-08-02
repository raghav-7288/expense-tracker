import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('a', 300));
    expect(result.current).toBe('a');
  });

  it('does not update until the delay has elapsed', () => {
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 300), {
      initialProps: { v: 'a' },
    });

    rerender({ v: 'ab' });
    expect(result.current).toBe('a'); // still old value

    act(() => { vi.advanceTimersByTime(299); });
    expect(result.current).toBe('a');

    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current).toBe('ab'); // updates at the boundary
  });

  it('coalesces rapid changes into a single trailing update', () => {
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 300), {
      initialProps: { v: '' },
    });

    // Simulate fast typing: each change resets the timer.
    for (const v of ['g', 'gr', 'gro', 'groc']) {
      rerender({ v });
      act(() => { vi.advanceTimersByTime(100); }); // < 300ms between keystrokes
    }
    // Nothing has settled yet.
    expect(result.current).toBe('');

    act(() => { vi.advanceTimersByTime(300); });
    // Only the final value lands — intermediates were skipped.
    expect(result.current).toBe('groc');
  });

  it('clears its pending timer on unmount (no leak / no late update)', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
    const { rerender, unmount } = renderHook(({ v }) => useDebouncedValue(v, 300), {
      initialProps: { v: 'a' },
    });
    rerender({ v: 'b' }); // schedules a timer
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });
});

