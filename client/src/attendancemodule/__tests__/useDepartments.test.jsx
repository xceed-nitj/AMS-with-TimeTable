import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDepartments } from '../useDepartments';

describe('useDepartments', () => {
  it('sanitizes spaces to underscores and dedupes case-insensitively', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            departments: [{ dept: 'Computer Science' }, { dept: 'COMPUTER_SCIENCE' }, { dept: 'ECE' }],
          }),
      }),
    );

    const { result } = renderHook(() => useDepartments());
    await waitFor(() => expect(result.current.deptLoading).toBe(false));

    expect(result.current.departments).toEqual(['Computer_Science', 'ECE']);
    expect(result.current.deptError).toBeNull();
  });

  it('sets an error message when the department list is empty', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ json: () => Promise.resolve({ departments: [] }) }));

    const { result } = renderHook(() => useDepartments());
    await waitFor(() => expect(result.current.deptLoading).toBe(false));

    expect(result.current.deptError).toBe('No departments found in DB');
  });

  it('does not check response.ok — parses the body even on a non-ok response', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ departments: [{ dept: 'CSE' }] }),
      }),
    );

    const { result } = renderHook(() => useDepartments());
    await waitFor(() => expect(result.current.deptLoading).toBe(false));

    expect(result.current.departments).toEqual(['CSE']);
    expect(result.current.deptError).toBeNull();
  });

  it('sets an error when fetch itself rejects', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('network down')));

    const { result } = renderHook(() => useDepartments());
    await waitFor(() => expect(result.current.deptLoading).toBe(false));

    expect(result.current.deptError).toBe('network down');
  });
});
