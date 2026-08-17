import { describe, it, expect } from 'vitest';
import { workItemToTicket, ticketToWorkItem } from './devops';
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
        displayName: 'Akash',
        uniqueName: 'akash@knowall.ai',
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
