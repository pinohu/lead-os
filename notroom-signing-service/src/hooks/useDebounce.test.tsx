import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'updated', delay: 500 });

    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Fast-forward time
    vi.advanceTimersByTime(500);

    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });

  it('should clear timeout on new value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    // Change value multiple times quickly
    rerender({ value: 'first', delay: 500 });
    vi.advanceTimersByTime(200);
    
    rerender({ value: 'second', delay: 500 });
    vi.advanceTimersByTime(200);
    
    rerender({ value: 'third', delay: 500 });
    
    // Should still be initial value
    expect(result.current).toBe('initial');

    // Fast-forward remaining time
    vi.advanceTimersByTime(500);

    await waitFor(() => {
      // Should only have the last value
      expect(result.current).toBe('third');
    });
  });

  it('should work with different delay values', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 1000 },
      }
    );

    rerender({ value: 'updated', delay: 1000 });

    // Should not update after 500ms
    vi.advanceTimersByTime(500);
    expect(result.current).toBe('initial');

    // Should update after 1000ms
    vi.advanceTimersByTime(500);
    
    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });

  it('should work with number values', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 0, delay: 500 },
      }
    );

    rerender({ value: 100, delay: 500 });
    vi.advanceTimersByTime(500);

    await waitFor(() => {
      expect(result.current).toBe(100);
    });
  });

  it('should work with object values', async () => {
    const initialObj = { name: 'initial' };
    const updatedObj = { name: 'updated' };

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: initialObj, delay: 500 },
      }
    );

    rerender({ value: updatedObj, delay: 500 });
    vi.advanceTimersByTime(500);

    await waitFor(() => {
      expect(result.current).toEqual(updatedObj);
    });
  });

  it('should handle rapid value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'a', delay: 500 },
      }
    );

    // Rapid changes
    ['b', 'c', 'd', 'e'].forEach((val, index) => {
      rerender({ value: val, delay: 500 });
      vi.advanceTimersByTime(100);
    });

    // Should still be initial value
    expect(result.current).toBe('a');

    // Fast-forward remaining time
    vi.advanceTimersByTime(500);

    await waitFor(() => {
      // Should only have the last value
      expect(result.current).toBe('e');
    });
  });
});

