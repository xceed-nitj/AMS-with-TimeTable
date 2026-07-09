import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/renderWithProviders';
import ExportReportsTab from '../ExportReportsTab';

function mockFetchRouter(overrides = {}) {
  global.fetch = vi.fn((url) => {
    const u = String(url);
    for (const [matcher, handler] of Object.entries(overrides)) {
      if (u.includes(matcher)) return handler(u);
    }
    if (u.includes('/settings/batches')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ batches: [{ batchYear: '2027' }] }) });
    }
    if (u.includes('/ground-truth/departments')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ departments: [{ dept: 'CSE' }] }) });
    }
    if (u.includes('/export-options')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ subjects: [], semesters: [] }) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
}

beforeEach(() => {
  mockFetchRouter();
});

describe('ExportReportsTab', () => {
  it('populates the Year and Department dropdowns from the fetched lists', async () => {
    renderWithProviders(<ExportReportsTab />);
    await waitFor(() => expect(screen.getByRole('option', { name: 'CSE' })).toBeInTheDocument());
    expect(screen.getByRole('option', { name: '2027' })).toBeInTheDocument();
  });

  // The Degree/Department/Year/Mode/Value/Date-range <select> elements have
  // no htmlFor/id linking them to their <label>s, so getByLabelText can't
  // find them — target by combobox order instead: [0]=Degree, [1]=Department,
  // [2]=Year, [3]=Mode, [4]=Value(Semester/Subject), [5]=DateRange.
  it('shows the empty-state message once a full batch resolves to no data', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ExportReportsTab />);
    await waitFor(() => expect(screen.getByRole('option', { name: 'CSE' })).toBeInTheDocument());

    const [, deptSelect, yearSelect] = screen.getAllByRole('combobox');
    await user.selectOptions(deptSelect, 'CSE');
    await user.selectOptions(yearSelect, '2027');

    expect(await screen.findByText(/no attendance has been recorded yet/i)).toBeInTheDocument();
    // Both action buttons stay disabled with nothing selected to export.
    expect(screen.getByRole('button', { name: /show details/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /download csv/i })).toBeDisabled();
  });

  it('renders a preview table after Show Details resolves', async () => {
    mockFetchRouter({
      '/export-options': () =>
        Promise.resolve({ ok: true, json: () => Promise.resolve({ subjects: [], semesters: ['5'] }) }),
      '/reports/export': () =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              dates: ['2026-07-09'],
              rows: [{ rollNo: '21CS001', statuses: ['P'] }],
            }),
        }),
    });
    const user = userEvent.setup();
    renderWithProviders(<ExportReportsTab />);
    await waitFor(() => expect(screen.getByRole('option', { name: 'CSE' })).toBeInTheDocument());

    const [, deptSelect, yearSelect, , valueSelect] = screen.getAllByRole('combobox');
    await user.selectOptions(deptSelect, 'CSE');
    await user.selectOptions(yearSelect, '2027');
    await waitFor(() => expect(screen.getByRole('option', { name: '5' })).toBeInTheDocument());
    await user.selectOptions(valueSelect, '5');

    await user.click(screen.getByRole('button', { name: /show details/i }));

    expect(await screen.findByText('21CS001')).toBeInTheDocument();
    expect(screen.getByText(/1 students/)).toBeInTheDocument();
  });
});
