'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useSession } from 'next-auth/react';
import { useOrganization } from './OrganizationProvider';
import type { TicketCounts } from '@/types';

/**
 * Sidebar ticket counts, and a way to invalidate them.
 *
 * The counts used to be fetched once in MainLayout, keyed on session and
 * organisation, with nothing to invalidate them afterwards. Deleting a ticket
 * removed it from the list and showed a toast, but every count in the sidebar
 * kept its old value until the page was reloaded (issue #404).
 *
 * Delete was only the reported symptom. Every count is derived from ticket
 * status and assignee, so creating a ticket, moving one between states and
 * assigning one all leave the sidebar wrong in the same way. Rather than
 * patching the delete path, mutations call `refresh()` and the numbers follow.
 */

interface TicketCountsContextType {
  counts: TicketCounts | undefined;
  isLoading: boolean;
  /**
   * Mark the counts stale and refetch. Safe to call from a loop — bursts are
   * coalesced into a single request.
   */
  refresh: () => void;
}

const TicketCountsContext = createContext<TicketCountsContextType | undefined>(undefined);

/**
 * How long to wait before acting on a refresh request.
 *
 * A bulk action fires one mutation per selected item and each one asks for a
 * refresh, so without this a twenty-ticket close would trigger twenty full
 * count recalculations — each of which reads every ticket in the org.
 */
const COALESCE_MS = 400;

interface Props {
  children: React.ReactNode;
}

export default function TicketCountsProvider({ children }: Props) {
  const { data: session } = useSession();
  const { selectedOrganization } = useOrganization();
  const [counts, setCounts] = useState<TicketCounts | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  // Monotonic id so a slow earlier response cannot overwrite a newer one —
  // easy to hit when a mutation refresh races the initial load.
  const requestIdRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const accessToken = session?.accessToken;
  const accountName = selectedOrganization?.accountName;

  const fetchCounts = useCallback(async () => {
    if (!accessToken || !accountName) return;

    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    try {
      const response = await fetch('/api/devops/ticket-counts', {
        headers: { 'x-devops-org': accountName },
      });
      if (!response.ok) return;
      const data = await response.json();
      if (requestId === requestIdRef.current) setCounts(data);
    } catch (error) {
      // Non-fatal: the sidebar keeps the numbers it has rather than blanking.
      console.error('Failed to fetch ticket counts:', error);
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [accessToken, accountName]);

  const refresh = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void fetchCounts();
    }, COALESCE_MS);
  }, [fetchCounts]);

  useEffect(() => {
    void fetchCounts();
  }, [fetchCounts]);

  // Drop a pending refresh on unmount so it cannot fire into a dead tree.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const value = useMemo(() => ({ counts, isLoading, refresh }), [counts, isLoading, refresh]);

  return <TicketCountsContext.Provider value={value}>{children}</TicketCountsContext.Provider>;
}

/**
 * Read the sidebar counts, and invalidate them after a mutation.
 *
 * Returns a no-op `refresh` outside the provider rather than throwing: a
 * component that mutates tickets should not break when rendered in isolation,
 * for instance in a test or a standalone dialog.
 */
export function useTicketCounts(): TicketCountsContextType {
  const context = useContext(TicketCountsContext);
  if (!context) {
    return { counts: undefined, isLoading: false, refresh: () => {} };
  }
  return context;
}
