import { describe, it, expect } from 'vitest';
import {
  normalizeStateName,
  canTypeEnterColumn,
  resolveStateForColumn,
  type AllowedStates,
} from './kanban-columns';

// The real state sets from the KnowAll "Internal" project, as returned by the
// DevOps API. Note the state is spelled "Todo", not "To Do" like the column.
const KNOWALL: AllowedStates = {
  Internal: {
    Bug: ['New', 'Todo', 'Active', 'Blocked', 'Resolved', 'Closed', 'Removed'],
    Task: ['New', 'Todo', 'Active', 'Blocked', 'Closed', 'Removed'],
    Enhancement: ['New', 'Todo', 'Active', 'Blocked', 'Resolved', 'Closed', 'Removed'],
    Issue: ['New', 'Active', 'Closed'],
    Risk: ['New', 'Active', 'Closed'],
    Question: ['New', 'Active', 'Blocked', 'Closed'],
  },
};

describe('KnowAll Internal project — real state sets', () => {
  it('only Bug, Task and Enhancement can reach the "To Do" column', () => {
    const canReach = Object.keys(KNOWALL.Internal).filter((type) =>
      canTypeEnterColumn('Internal', type, 'To Do', KNOWALL)
    );
    expect(canReach.sort()).toEqual(['Bug', 'Enhancement', 'Task']);
  });

  it('maps the "To Do" column onto the actual "Todo" state (#391)', () => {
    expect(resolveStateForColumn('Internal', 'Task', 'To Do', KNOWALL)).toBe('Todo');
    expect(resolveStateForColumn('Internal', 'Bug', 'To Do', KNOWALL)).toBe('Todo');
  });

  it('Blocked is reachable for Bug/Task/Question but not Issue/Risk', () => {
    expect(canTypeEnterColumn('Internal', 'Task', 'Blocked', KNOWALL)).toBe(true);
    expect(canTypeEnterColumn('Internal', 'Question', 'Blocked', KNOWALL)).toBe(true);
    expect(canTypeEnterColumn('Internal', 'Issue', 'Blocked', KNOWALL)).toBe(false);
    expect(canTypeEnterColumn('Internal', 'Risk', 'Blocked', KNOWALL)).toBe(false);
  });

  it('Task has no Resolved state, so that column must refuse Tasks', () => {
    expect(canTypeEnterColumn('Internal', 'Task', 'Resolved', KNOWALL)).toBe(false);
    expect(canTypeEnterColumn('Internal', 'Bug', 'Resolved', KNOWALL)).toBe(true);
  });

  it('leaves already-matching column names untouched', () => {
    expect(resolveStateForColumn('Internal', 'Task', 'Active', KNOWALL)).toBe('Active');
    expect(resolveStateForColumn('Internal', 'Task', 'New', KNOWALL)).toBe('New');
  });
});

// The reason the map is keyed by project: process templates are per project,
// so the same work item type carries different states in each. A union across
// projects would offer a drop target the card's own project rejects.
describe('two projects on different process templates', () => {
  const MIXED: AllowedStates = {
    // KnowAll template — Bug has Todo.
    Internal: {
      Bug: ['New', 'Todo', 'Active', 'Closed'],
    },
    // Stock Agile template — Bug has no To Do state at all.
    Consulting: {
      Bug: ['New', 'Active', 'Resolved', 'Closed'],
    },
  };

  it("doesn't let one project's states unblock a column in another", () => {
    expect(canTypeEnterColumn('Internal', 'Bug', 'To Do', MIXED)).toBe(true);
    expect(canTypeEnterColumn('Consulting', 'Bug', 'To Do', MIXED)).toBe(false);
  });

  it("doesn't borrow another project's state name when writing", () => {
    expect(resolveStateForColumn('Internal', 'Bug', 'To Do', MIXED)).toBe('Todo');
    // Nothing to resolve to here — the column name goes through unchanged and
    // DevOps has the final say.
    expect(resolveStateForColumn('Consulting', 'Bug', 'To Do', MIXED)).toBe('To Do');
  });

  it('resolves Resolved only for the project that defines it', () => {
    expect(canTypeEnterColumn('Consulting', 'Bug', 'Resolved', MIXED)).toBe(true);
    expect(canTypeEnterColumn('Internal', 'Bug', 'Resolved', MIXED)).toBe(false);
  });
});

describe('resolveStateForColumn — fallbacks', () => {
  it('returns the column name unchanged when the type has no matching state', () => {
    expect(resolveStateForColumn('Internal', 'Issue', 'To Do', KNOWALL)).toBe('To Do');
  });

  it('returns the column name when states are unknown, deferring to the server', () => {
    expect(resolveStateForColumn('Internal', 'Task', 'To Do', {})).toBe('To Do');
    expect(resolveStateForColumn('Internal', 'Task', 'To Do', undefined)).toBe('To Do');
    expect(resolveStateForColumn('Internal', undefined, 'To Do', KNOWALL)).toBe('To Do');
    expect(resolveStateForColumn(undefined, 'Task', 'To Do', KNOWALL)).toBe('To Do');
    expect(resolveStateForColumn('Unknown Project', 'Task', 'To Do', KNOWALL)).toBe('To Do');
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
  const TMINUS: AllowedStates = {
    'T-Minus-15': {
      Task: ['New', 'To Do', 'Active', 'Resolved', 'Closed'],
      Bug: ['New', 'Active', 'Resolved', 'Closed'],
      Issue: ['New', 'Active', 'Closed'],
    },
  };

  it('allows a type into a column it has a state for', () => {
    expect(canTypeEnterColumn('T-Minus-15', 'Task', 'To Do', TMINUS)).toBe(true);
    expect(canTypeEnterColumn('T-Minus-15', 'Bug', 'Active', TMINUS)).toBe(true);
  });

  it('blocks a type from a column it has no state for (#391)', () => {
    expect(canTypeEnterColumn('T-Minus-15', 'Bug', 'To Do', TMINUS)).toBe(false);
    expect(canTypeEnterColumn('T-Minus-15', 'Issue', 'To Do', TMINUS)).toBe(false);
  });

  it('blocks every type from Blocked, which this fixture leaves out', () => {
    for (const type of Object.keys(TMINUS['T-Minus-15'])) {
      expect(canTypeEnterColumn('T-Minus-15', type, 'Blocked', TMINUS)).toBe(false);
    }
  });

  it('matches tolerantly, so a "ToDo" state satisfies the "To Do" column', () => {
    expect(canTypeEnterColumn('P', 'Task', 'To Do', { P: { Task: ['ToDo'] } })).toBe(true);
    expect(canTypeEnterColumn('P', 'Task', 'To Do', { P: { Task: ['To-Do'] } })).toBe(true);
  });

  it('fails open when the project, type or state discovery returned nothing', () => {
    expect(canTypeEnterColumn('T-Minus-15', 'Enhancement', 'To Do', TMINUS)).toBe(true);
    expect(canTypeEnterColumn('T-Minus-15', 'Task', 'To Do', {})).toBe(true);
    expect(canTypeEnterColumn('T-Minus-15', 'Task', 'To Do', undefined)).toBe(true);
    expect(canTypeEnterColumn('T-Minus-15', 'Task', 'To Do', { 'T-Minus-15': { Task: [] } })).toBe(
      true
    );
    expect(canTypeEnterColumn('T-Minus-15', undefined, 'To Do', TMINUS)).toBe(true);
    expect(canTypeEnterColumn(undefined, 'Task', 'To Do', TMINUS)).toBe(true);
    // A project we discovered nothing for must not be blocked wholesale — one
    // failed states call would otherwise grey out every column for it.
    expect(canTypeEnterColumn('Unknown Project', 'Bug', 'To Do', TMINUS)).toBe(true);
  });
});
