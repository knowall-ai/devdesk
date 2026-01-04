import type { UserProfile, UserProfileSettings } from '@/types';

/**
 * Shared profile settings store.
 * In production, this should be stored in a database.
 *
 * Note: The GET endpoint for settings is intentionally accessible to all
 * authenticated users (not just admins) because the frontend needs to know
 * which fields are editable. Only the PATCH endpoint requires admin access.
 */
export let profileSettings: UserProfileSettings = {
  allowViewProfile: true,
  allowEditProfile: true,
  allowChangePassword: false,
  editableFields: ['displayName', 'phone', 'timezone', 'language'],
};

/**
 * Update profile settings. Only call from admin-protected endpoints.
 */
export function updateProfileSettings(updates: Partial<UserProfileSettings>): void {
  profileSettings = {
    ...profileSettings,
    ...updates,
  };
}

/**
 * Get the current profile settings.
 */
export function getProfileSettings(): UserProfileSettings {
  return profileSettings;
}

/**
 * Valid editable fields for profile updates.
 */
export const VALID_EDITABLE_FIELDS: (keyof UserProfile)[] = [
  'displayName',
  'phone',
  'timezone',
  'language',
];
