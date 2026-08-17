import { describe, it, expect } from 'vitest';
import { normalizeStateName, canTypeEnterColumn } from './kanban-columns';

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
