import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/renderWithProviders';
import EditSessionDates from '../editSessionDates';

// Broad URL-pattern router: EditSessionDates and every child tab
// (NotificationSettingsTab, DeptMenuConfig, DegreeManagement,
// ErpSyncSettingsTab) fetch independently on mount, so unmocked URLs must
// resolve to something harmless rather than reject.
function mockFetchRouter() {
  global.fetch = vi.fn((url) => {
    const u = String(url);
    if (u.includes('/user/getuser')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ user: { role: ['iams-admin'] } }) });
    }
    if (u.includes('/allotment/session')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }
    if (u.includes('/settings/batches')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ batches: [] }) });
    }
    if (u.includes('/settings/notifications/')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ settings: { enabled: false, roles: [], recipients: [] } }) });
    }
    if (u.includes('/ground-truth/departments')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ departments: [] }) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
}

beforeEach(() => {
  mockFetchRouter();
});

describe('EditSessionDates', () => {
  it('shows the unauthorized message when the user lacks iams-admin', async () => {
    global.fetch = vi.fn((url) => {
      if (String(url).includes('/user/getuser')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ user: { role: ['faculty'] } }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
    renderWithProviders(<EditSessionDates />);
    expect(await screen.findByText(/iams-admin/i)).toBeInTheDocument();
  });

  it('renders the tab bar once authorized, defaulting to Session Dates', async () => {
    renderWithProviders(<EditSessionDates />);
    expect(await screen.findByText('Batch Management')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Session Dates' })).toHaveClass('active');
  });

  it('switching to the Email Notifications tab mounts NotificationSettingsTab and fetches its settings', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EditSessionDates />);
    await screen.findByText('Batch Management');

    await user.click(screen.getByRole('button', { name: 'Email Notifications' }));

    await waitFor(() => {
      expect(global.fetch.mock.calls.some(([url]) => String(url).includes('/settings/notifications/'))).toBe(true);
    });
  });

  it('switching to the Batch Management tab loads and lists seeded batch years', async () => {
    global.fetch = vi.fn((url) => {
      const u = String(url);
      if (u.includes('/user/getuser')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ user: { role: ['iams-admin'] } }) });
      }
      if (u.includes('/settings/batches')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ batches: [{ _id: 'b1', batchYear: '2027' }] }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
    const user = userEvent.setup();
    renderWithProviders(<EditSessionDates />);
    await screen.findByText('Batch Management');

    await user.click(screen.getByRole('button', { name: 'Batch Management' }));

    expect(await screen.findByText('2027')).toBeInTheDocument();
  });
});
