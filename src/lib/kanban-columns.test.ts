import { describe, it, expect } from 'vitest';
import { normalizeStateName, canTypeEnterColumn, resolveStateForColumn } from './kanban-columns';

// The real state sets from the KnowAll "Internal" project, as returned by the
// DevOps API. Note the state is spelled "Todo", not "To Do" like the column.
const KNOWALL_STATES: Record<string, string[]> = {
  Bug: ['New', 'Todo', 'Active', 'Blocked', 'Resolved', 'Closed', 'Removed'],
  Task: ['New', 'Todo', 'Active', 'Blocked', 'Closed', 'Removed'],
  Enhancement: ['New', 'Todo', 'Active', 'Blocked', 'Resolved', 'Closed', 'Removed'],
  Issue: ['New', 'Active', 'Closed'],
  Risk: ['New', 'Active', 'Closed'],
  Question: ['New', 'Active', 'Blocked', 'Closed'],
};

describe('KnowAll Internal project — real state sets', () => {
  it('only Bug, Task and Enhancement can reach the "To Do" column', () => {
    const canReach = Object.keys(KNOWALL_STATES).filter((type) =>
      canTypeEnterColumn(type, 'To Do', KNOWALL_STATES)
    );
    expect(canReach.sort()).toEqual(['Bug', 'Enhancement', 'Task']);
  });

  it('maps the "To Do" column onto the actual "Todo" state (#391)', () => {
    expect(resolveStateForColumn('Task', 'To Do', KNOWALL_STATES)).toBe('Todo');
    expect(resolveStateForColumn('Bug', 'To Do', KNOWALL_STATES)).toBe('Todo');
  });

  it('Blocked is reachable for Bug/Task/Question but not Issue/Risk', () => {
    expect(canTypeEnterColumn('Task', 'Blocked', KNOWALL_STATES)).toBe(true);
    expect(canTypeEnterColumn('Question', 'Blocked', KNOWALL_STATES)).toBe(true);
    expect(canTypeEnterColumn('Issue', 'Blocked', KNOWALL_STATES)).toBe(false);
    expect(canTypeEnterColumn('Risk', 'Blocked', KNOWALL_STATES)).toBe(false);
  });

  it('Task has no Resolved state, so that column must refuse Tasks', () => {
    expect(canTypeEnterColumn('Task', 'Resolved', KNOWALL_STATES)).toBe(false);
    expect(canTypeEnterColumn('Bug', 'Resolved', KNOWALL_STATES)).toBe(true);
  });

  it('leaves already-matching column names untouched', () => {
    expect(resolveStateForColumn('Task', 'Active', KNOWALL_STATES)).toBe('Active');
    expect(resolveStateForColumn('Task', 'New', KNOWALL_STATES)).toBe('New');
  });
});

describe('resolveStateForColumn — fallbacks', () => {
  it('returns the column name unchanged when the type has no matching state', () => {
    expect(resolveStateForColumn('Issue', 'To Do', KNOWALL_STATES)).toBe('To Do');
  });

  it('returns the column name when states are unknown, deferring to the server', () => {
    expect(resolveStateForColumn('Task', 'To Do', {})).toBe('To Do');
    expect(resolveStateForColumn('Task', 'To Do', undefined)).toBe('To Do');
    expect(resolveStateForColumn(undefined, 'To Do', KNOWALL_STATES)).toBe('To Do');
  });
});

describe('normalizeStateName', () => {
  it('collapses the "To Do" spelling variants onto one key', () => {
    const variants = ['To Do', 'to do', 'ToDo', 'To-Do', 'TO DO', 'to_do'];
    for (const variant of variants) {
      expect(normalizeStateName(variant)).toBe('todo');
    }
  });

  it('handles a non-breaking space', () => {
    expect(normalizeStateName('To Do')).toBe('todo');
  });

  it('keeps genuinely different states distinct', () => {
    expect(normalizeStateName('New')).not.toBe(normalizeStateName('To Do'));
    expect(normalizeStateName('Doing')).not.toBe(normalizeStateName('Done'));
  });
});

describe('canTypeEnterColumn', () => {
  // Mirrors a T-Minus-15 org: "To Do" was added to Task but the other types
  // kept the Agile state set they inherited.
  const allowedStatesByType: Record<string, string[]> = {
    Task: ['New', 'To Do', 'Active', 'Resolved', 'Closed'],
    Bug: ['New', 'Active', 'Resolved', 'Closed'],
    Issue: ['New', 'Active', 'Closed'],
  };

  it('allows a type into a column it has a state for', () => {
    expect(canTypeEnterColumn('Task', 'To Do', allowedStatesByType)).toBe(true);
    expect(canTypeEnterColumn('Bug', 'Active', allowedStatesByType)).toBe(true);
  });

  it('blocks a type from a column it has no state for (#391)', () => {
    expect(canTypeEnterColumn('Bug', 'To Do', allowedStatesByType)).toBe(false);
    expect(canTypeEnterColumn('Issue', 'To Do', allowedStatesByType)).toBe(false);
  });

  it('blocks every type from Blocked, which no template defines', () => {
    for (const type of Object.keys(allowedStatesByType)) {
      expect(canTypeEnterColumn(type, 'Blocked', allowedStatesByType)).toBe(false);
    }
  });

  it('matches tolerantly, so a "ToDo" state satisfies the "To Do" column', () => {
    expect(canTypeEnterColumn('Task', 'To Do', { Task: ['ToDo'] })).toBe(true);
    expect(canTypeEnterColumn('Task', 'To Do', { Task: ['To-Do'] })).toBe(true);
  });

  it('fails open when the type is unknown or state discovery returned nothing', () => {
    expect(canTypeEnterColumn('Enhancement', 'To Do', allowedStatesByType)).toBe(true);
    expect(canTypeEnterColumn('Task', 'To Do', {})).toBe(true);
    expect(canTypeEnterColumn('Task', 'To Do', undefined)).toBe(true);
    expect(canTypeEnterColumn('Task', 'To Do', { Task: [] })).toBe(true);
    expect(canTypeEnterColumn(undefined, 'To Do', allowedStatesByType)).toBe(true);
  });
});
