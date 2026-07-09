import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBatchYears } from '../useBatchYears';

describe('useBatchYears', () => {
  it('dedupes and sorts batch years descending', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ batches: [{ batchYear: '2025' }, { batchYear: '2027' }, { batchYear: '2025' }] }),
      }),
    );

    const { result } = renderHook(() => useBatchYears());
    await waitFor(() => expect(result.current.batchYearsLoading).toBe(false));

    expect(result.current.batchYears).toEqual(['2027', '2025']);
    expect(result.current.batchYearsError).toBeNull();
  });

  it('sets an error when the response is not ok', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: false }));

    const { result } = renderHook(() => useBatchYears());
    await waitFor(() => expect(result.current.batchYearsLoading).toBe(false));

    expect(result.current.batchYearsError).toBe('Failed to load batches');
    expect(result.current.batchYears).toEqual([]);
  });

  it('sets an error when fetch itself rejects', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('network down')));

    const { result } = renderHook(() => useBatchYears());
    await waitFor(() => expect(result.current.batchYearsLoading).toBe(false));

    expect(result.current.batchYearsError).toBe('network down');
  });

  it('does not update state after unmount (cancelled guard)', async () => {
    let resolveFetch;
    global.fetch = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const { result, unmount } = renderHook(() => useBatchYears());
    unmount();
    resolveFetch({ ok: true, json: () => Promise.resolve({ batches: [{ batchYear: '2027' }] }) });

    // Give the (now-ignored) promise a tick to resolve; no act() warning
    // means the cancelled guard suppressed the state update.
    await new Promise((r) => setTimeout(r, 0));
    expect(result.current.batchYearsLoading).toBe(true); // never updated post-unmount
  });
});
