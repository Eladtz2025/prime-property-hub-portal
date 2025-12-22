import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

describe('useDebounce Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // Change the value
    rerender({ value: 'updated', delay: 500 });

    // Value should still be initial
    expect(result.current).toBe('initial');

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Now value should be updated
    expect(result.current).toBe('updated');
  });

  it('cancels previous timeout on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 500 } }
    );

    // Rapid changes
    rerender({ value: 'second', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    
    rerender({ value: 'third', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Value should still be first
    expect(result.current).toBe('first');

    // Complete the delay
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Value should be the last one
    expect(result.current).toBe('third');
  });
});
