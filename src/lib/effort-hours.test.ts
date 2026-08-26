import { describe, it, expect, vi, afterEach } from 'vitest';
import { workItemToTicket, ticketToWorkItem, AzureDevOpsService } from './devops';
import type { DevOpsWorkItem } from '@/types';

/** Minimal work item with only the fields workItemToTicket needs. */
function makeWorkItem(extraFields: Record<string, unknown> = {}): DevOpsWorkItem {
  return {
    id: 6609,
    fields: {
      'System.Title': 'Remaining hours should default to 0',
      'System.State': 'To Do',
      'System.WorkItemType': 'Task',
      'System.TeamProject': 'Internal',
      'System.CreatedBy': {
        id: 'user-1',
        displayName: 'Test User',
        uniqueName: 'test@example.com',
      },
      'System.CreatedDate': '2026-08-01T00:00:00Z',
      'System.ChangedDate': '2026-08-02T00:00:00Z',
      ...extraFields,
    },
  } as unknown as DevOpsWorkItem;
}

describe('workItemToTicket — effort hours', () => {
  it('carries the hours through instead of dropping them', () => {
    const ticket = workItemToTicket(
      makeWorkItem({
        'Microsoft.VSTS.Scheduling.RemainingWork': 6.5,
        'Microsoft.VSTS.Scheduling.CompletedWork': 2,
        'Microsoft.VSTS.Scheduling.OriginalEstimate': 8,
      })
    );

    expect(ticket.remainingWork).toBe(6.5);
    expect(ticket.completedWork).toBe(2);
    expect(ticket.originalEstimate).toBe(8);
  });

  it('leaves hours undefined when DevOps omits the fields', () => {
    const ticket = workItemToTicket(makeWorkItem());

    expect(ticket.remainingWork).toBeUndefined();
    expect(ticket.completedWork).toBeUndefined();
    expect(ticket.originalEstimate).toBeUndefined();
  });

  it('distinguishes a real zero from an unset field', () => {
    const ticket = workItemToTicket(makeWorkItem({ 'Microsoft.VSTS.Scheduling.RemainingWork': 0 }));

    expect(ticket.remainingWork).toBe(0);
  });

  it('coerces string values and rejects junk rather than yielding NaN', () => {
    expect(
      workItemToTicket(makeWorkItem({ 'Microsoft.VSTS.Scheduling.RemainingWork': '4.5' }))
        .remainingWork
    ).toBe(4.5);
    expect(
      workItemToTicket(makeWorkItem({ 'Microsoft.VSTS.Scheduling.RemainingWork': 'n/a' }))
        .remainingWork
    ).toBeUndefined();
    expect(
      workItemToTicket(makeWorkItem({ 'Microsoft.VSTS.Scheduling.RemainingWork': '' }))
        .remainingWork
    ).toBeUndefined();
  });
});

describe('ticketToWorkItem — effort hours', () => {
  it('passes real hours to the dialog instead of hardcoding zero', () => {
    const ticket = workItemToTicket(
      makeWorkItem({
        'Microsoft.VSTS.Scheduling.RemainingWork': 6.5,
        'Microsoft.VSTS.Scheduling.CompletedWork': 2,
        'Microsoft.VSTS.Scheduling.OriginalEstimate': 8,
      })
    );

    const workItem = ticketToWorkItem(ticket);

    expect(workItem.remainingWork).toBe(6.5);
    expect(workItem.completedWork).toBe(2);
    expect(workItem.originalEstimate).toBe(8);
  });

  it('renders unset hours as 0, which the dialog displays as "0h"', () => {
    const workItem = ticketToWorkItem(workItemToTicket(makeWorkItem()));

    expect(workItem.remainingWork).toBe(0);
    expect(workItem.completedWork).toBe(0);
    expect(workItem.originalEstimate).toBe(0);
  });
});

describe('getTickets — effort field selection', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** WIQL query first, then the batched work item fetch. */
  function stubFetch(workItem: unknown) {
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        calls.push(String(url));
        const body = String(url).includes('/wiql')
          ? { workItems: [{ id: 6609 }] }
          : { value: [workItem] };
        return { ok: true, status: 200, json: async () => body } as unknown as Response;
      })
    );
    return calls;
  }

  it('asks DevOps for the hours it maps, so getAllTickets can see them', async () => {
    const calls = stubFetch(
      makeWorkItem({
        'Microsoft.VSTS.Scheduling.RemainingWork': 6.5,
        'Microsoft.VSTS.Scheduling.CompletedWork': 2,
        'Microsoft.VSTS.Scheduling.OriginalEstimate': 8,
      })
    );

    const workItems = await new AzureDevOpsService('token', 'org').getTickets('Internal');

    // The batch fetch names every field it wants; an omission here silently
    // strips the hours from the getAllTickets path (#391 review).
    const batchUrl = calls.find((url) => url.includes('/workitems?ids='));
    expect(batchUrl).toBeDefined();
    expect(batchUrl).toContain('Microsoft.VSTS.Scheduling.RemainingWork');
    expect(batchUrl).toContain('Microsoft.VSTS.Scheduling.CompletedWork');
    expect(batchUrl).toContain('Microsoft.VSTS.Scheduling.OriginalEstimate');

    const ticket = workItemToTicket(workItems[0]);
    expect(ticket.remainingWork).toBe(6.5);
    expect(ticket.completedWork).toBe(2);
    expect(ticket.originalEstimate).toBe(8);
  });
});
