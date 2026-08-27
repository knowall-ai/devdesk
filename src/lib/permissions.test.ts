import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  mergePermissions,
  isPermission,
  isUserRole,
  parsePermissionList,
  parseRoleDefinitions,
  validatePermissionsConfig,
  hasManageableAdmin,
} from './permissions';
import type { Permission, PermissionsConfig, SessionPermissions } from '@/types';

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

describe('isPermission / isUserRole', () => {
  it('accepts the known values', () => {
    expect(isPermission('tickets:delete')).toBe(true);
    expect(isUserRole('admin')).toBe(true);
  });

  it('rejects anything else, including near misses', () => {
    expect(isPermission('tickets:destroy')).toBe(false);
    expect(isPermission('')).toBe(false);
    expect(isPermission(null)).toBe(false);
    expect(isUserRole('superadmin')).toBe(false);
    expect(isUserRole(undefined)).toBe(false);
  });
});

describe('parsePermissionList', () => {
  it('accepts a list of known permissions and drops duplicates', () => {
    expect(parsePermissionList(['tickets:edit', 'tickets:edit'])).toEqual(['tickets:edit']);
  });

  it('accepts an empty list', () => {
    expect(parsePermissionList([])).toEqual([]);
  });

  it('rejects the whole list when one entry is unknown', () => {
    // Filtering instead would silently discard an admin's typo and leave them
    // looking at a permission they believe they granted.
    expect(parsePermissionList(['tickets:edit', 'tickets:teleport'])).toBeNull();
  });

  it('rejects a non-array', () => {
    expect(parsePermissionList('tickets:edit')).toBeNull();
    expect(parsePermissionList(undefined)).toBeNull();
  });
});

describe('parseRoleDefinitions', () => {
  const role = (over: Record<string, unknown> = {}) => ({
    name: 'agent',
    label: 'Agent',
    description: 'desc',
    permissions: ['tickets:view_all'],
    ...over,
  });

  it('accepts a well-formed definition', () => {
    expect(parseRoleDefinitions([role()])).toEqual([
      { name: 'agent', label: 'Agent', description: 'desc', permissions: ['tickets:view_all'] },
    ]);
  });

  it('defaults a missing description rather than rejecting', () => {
    const parsed = parseRoleDefinitions([role({ description: undefined })]);
    expect(parsed?.[0].description).toBe('');
  });

  it('rejects an unknown role name', () => {
    expect(parseRoleDefinitions([role({ name: 'owner' })])).toBeNull();
  });

  it('rejects a duplicate role name', () => {
    expect(parseRoleDefinitions([role(), role()])).toBeNull();
  });

  it('rejects a blank label', () => {
    expect(parseRoleDefinitions([role({ label: '   ' })])).toBeNull();
  });

  it('rejects an unknown permission inside a role', () => {
    expect(parseRoleDefinitions([role({ permissions: ['tickets:everything'] })])).toBeNull();
  });

  it('rejects an empty or non-array roles value', () => {
    expect(parseRoleDefinitions([])).toBeNull();
    expect(parseRoleDefinitions({})).toBeNull();
    expect(parseRoleDefinitions([null])).toBeNull();
  });
});

describe('validatePermissionsConfig', () => {
  const config = (over: Record<string, unknown> = {}) => ({
    defaultRole: 'agent',
    roles: [{ name: 'agent', label: 'Agent', description: '', permissions: ['tickets:view_all'] }],
    users: [],
    ...over,
  });

  it('accepts a valid config', () => {
    expect(validatePermissionsConfig(config())).not.toBeNull();
  });

  it('treats a missing users list as empty', () => {
    expect(validatePermissionsConfig(config({ users: undefined }))?.users).toEqual([]);
  });

  it('rejects a defaultRole with no matching definition', () => {
    // It would resolve to an empty permission set and lock out every user who
    // has no explicit override, with nothing on screen to explain why.
    expect(validatePermissionsConfig(config({ defaultRole: 'admin' }))).toBeNull();
  });

  it('rejects an unknown defaultRole', () => {
    expect(validatePermissionsConfig(config({ defaultRole: 'root' }))).toBeNull();
  });

  it('rejects a user override with an unknown role', () => {
    expect(
      validatePermissionsConfig(config({ users: [{ email: 'a@b.c', role: 'root' }] }))
    ).toBeNull();
  });

  it('rejects a user override with an unknown permission', () => {
    expect(
      validatePermissionsConfig(
        config({ users: [{ email: 'a@b.c', role: 'agent', permissions: ['tickets:nope'] }] })
      )
    ).toBeNull();
  });

  it('rejects a user override with no email', () => {
    expect(
      validatePermissionsConfig(config({ users: [{ email: '  ', role: 'agent' }] }))
    ).toBeNull();
  });

  it('rejects values that are not a config at all', () => {
    expect(validatePermissionsConfig(null)).toBeNull();
    expect(validatePermissionsConfig('{}')).toBeNull();
    expect(validatePermissionsConfig([])).toBeNull();
    expect(validatePermissionsConfig({})).toBeNull();
  });
});

describe('hasManageableAdmin', () => {
  const withRoles = (permissions: Permission[]): PermissionsConfig => ({
    defaultRole: 'agent',
    roles: [{ name: 'agent', label: 'Agent', description: '', permissions }],
    users: [],
  });

  it('is true while some role can still manage roles', () => {
    expect(hasManageableAdmin(withRoles(['admin:manage_roles']))).toBe(true);
  });

  it('is false once nobody can', () => {
    // This is the edit that cannot be undone from the admin screen: recovering
    // means hand-editing JSON on the server.
    expect(hasManageableAdmin(withRoles(['tickets:view_all']))).toBe(false);
  });
});
