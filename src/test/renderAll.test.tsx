import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LanguageProvider } from '@/lib/i18n';
import { AuthProvider } from '@/contexts/AuthContext';

import Index from '@/pages/Index';
import Catalog from '@/pages/Catalog';
import Admin from '@/pages/Admin';
import Leaderboard from '@/pages/Leaderboard';
import Settings from '@/pages/Settings';
import BooksManager from '@/components/admin/BooksManager';
import StudentsManager from '@/components/admin/StudentsManager';
import BorrowRequestsManager from '@/components/admin/BorrowRequestsManager';
import BorrowRecordsManager from '@/components/admin/BorrowRecordsManager';
import LeaderboardManager from '@/components/admin/LeaderboardManager';
import OverdueManager from '@/components/admin/OverdueManager';
import SettingsPanel from '@/components/admin/SettingsPanel';
import AnalyticsPanel from '@/components/admin/AnalyticsPanel';

// Polyfill ResizeObserver for JSDOM tests
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <AuthProvider>
            <BrowserRouter>
              {children}
            </BrowserRouter>
          </AuthProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

describe('Full Application Page and Component Render Audit', () => {
  it('renders Index page without errors', () => {
    const { container } = render(<Wrapper><Index /></Wrapper>);
    expect(container).toBeTruthy();
  });

  it('renders Catalog page without errors', () => {
    const { container } = render(<Wrapper><Catalog /></Wrapper>);
    expect(container).toBeTruthy();
  });

  it('renders Leaderboard page without errors', () => {
    const { container } = render(<Wrapper><Leaderboard /></Wrapper>);
    expect(container).toBeTruthy();
  });

  it('renders Settings page without errors', () => {
    const { container } = render(<Wrapper><Settings /></Wrapper>);
    expect(container).toBeTruthy();
  });

  it('renders Admin page without errors', () => {
    // Set admin session
    localStorage.setItem('imthiyaz_admin_session', '1');
    const { container } = render(<Wrapper><Admin /></Wrapper>);
    expect(container).toBeTruthy();
  });

  it('renders BooksManager component directly', () => {
    const { container } = render(<Wrapper><BooksManager /></Wrapper>);
    expect(container).toBeTruthy();
  });

  it('renders StudentsManager component directly', () => {
    const { container } = render(<Wrapper><StudentsManager /></Wrapper>);
    expect(container).toBeTruthy();
  });

  it('renders BorrowRequestsManager component directly', () => {
    const { container } = render(<Wrapper><BorrowRequestsManager /></Wrapper>);
    expect(container).toBeTruthy();
  });

  it('renders BorrowRecordsManager component directly', () => {
    const { container } = render(<Wrapper><BorrowRecordsManager /></Wrapper>);
    expect(container).toBeTruthy();
  });

  it('renders LeaderboardManager component directly', () => {
    const { container } = render(<Wrapper><LeaderboardManager /></Wrapper>);
    expect(container).toBeTruthy();
  });

  it('renders OverdueManager component directly', () => {
    const { container } = render(<Wrapper><OverdueManager /></Wrapper>);
    expect(container).toBeTruthy();
  });

  it('renders SettingsPanel component directly', () => {
    const { container } = render(<Wrapper><SettingsPanel /></Wrapper>);
    expect(container).toBeTruthy();
  });

  it('renders AnalyticsPanel component directly', () => {
    const { container } = render(<Wrapper><AnalyticsPanel /></Wrapper>);
    expect(container).toBeTruthy();
  });
});
