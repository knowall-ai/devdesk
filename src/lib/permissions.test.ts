import { describe, it, expect } from 'vitest';
import { hasPermission, hasAnyPermission, mergePermissions } from './permissions';
import type { Permission, SessionPermissions } from '@/types';

const session = (permissions: Permission[]): SessionPermissions => ({
  role: 'agent',
  permissions,
});

describe('hasPermission', () => {
  it('grants what is listed and nothing else', () => {
    const s = session(['tickets:view_all', 'tickets:edit']);
    expect(hasPermission(s, 'tickets:edit')).toBe(true);
    expect(hasPermission(s, 'tickets:delete')).toBe(false);
  });

  it('denies everything for an empty permission set', () => {
    expect(hasPermission(session([]), 'tickets:view_own')).toBe(false);
  });
});

describe('hasAnyPermission', () => {
  it('passes when one of the alternatives is held', () => {
    const s = session(['tickets:view_own']);
    expect(hasAnyPermission(s, ['tickets:view_all', 'tickets:view_own'])).toBe(true);
  });

  it('fails when none are held', () => {
    expect(hasAnyPermission(session(['team:view']), ['tickets:view_all', 'tickets:view_own'])).toBe(
      false
    );
  });

  it('fails on an empty alternatives list rather than passing by default', () => {
    expect(hasAnyPermission(session(['tickets:edit']), [])).toBe(false);
  });
});

describe('mergePermissions', () => {
  const base: Permission[] = ['tickets:view_all', 'tickets:edit'];

  it('returns the role permissions when there is no override', () => {
    expect(mergePermissions(base)).toEqual(base);
    expect(mergePermissions(base, {})).toEqual(base);
  });

  it('adds a granted permission', () => {
    expect(mergePermissions(base, { permissions: ['tickets:delete'] })).toContain('tickets:delete');
  });

  it('does not duplicate a permission the role already has', () => {
    const out = mergePermissions(base, { permissions: ['tickets:edit'] });
    expect(out.filter((p) => p === 'tickets:edit')).toHaveLength(1);
  });

  it('removes a revoked permission', () => {
    expect(mergePermissions(base, { revokedPermissions: ['tickets:edit'] })).not.toContain(
      'tickets:edit'
    );
  });

  it('lets revocation win over a grant of the same permission', () => {
    // A contradictory config must fail closed, not open.
    const out = mergePermissions(base, {
      permissions: ['tickets:delete'],
      revokedPermissions: ['tickets:delete'],
    });
    expect(out).not.toContain('tickets:delete');
  });

  it('does not mutate the role definition it was given', () => {
    const roleDefinition: Permission[] = ['tickets:view_all'];
    mergePermissions(roleDefinition, { permissions: ['tickets:delete'] });
    expect(roleDefinition).toEqual(['tickets:view_all']);
  });

  it('tolerates an empty revocation list', () => {
    expect(mergePermissions(base, { revokedPermissions: [] })).toEqual(base);
  });
});
