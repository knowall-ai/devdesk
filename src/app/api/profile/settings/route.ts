import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getProfileSettings,
  updateProfileSettings,
  VALID_EDITABLE_FIELDS,
} from '@/lib/profile-settings';
import type { UserProfile } from '@/types';

// Simple admin check - in production, implement proper role-based access
function isAdmin(email: string): boolean {
  // For now, consider all authenticated users as having access
  // In production, check against admin roles in Azure AD or database
  return !!email;
}

/**
 * GET /api/profile/settings
 *
 * Returns profile settings to authenticated users.
 * Note: This endpoint is intentionally accessible to all authenticated users
 * (not just admins) because the frontend needs to know which fields are
 * editable. Only the PATCH endpoint requires admin access to modify settings.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      settings: getProfileSettings(),
      success: true,
    });
  } catch (error) {
    console.error('Error fetching profile settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { allowViewProfile, allowEditProfile, allowChangePassword, editableFields } = body;

    // Validate editableFields if provided
    if (editableFields) {
      const invalidFields = editableFields.filter(
        (field: string) => !VALID_EDITABLE_FIELDS.includes(field as keyof UserProfile)
      );
      if (invalidFields.length > 0) {
        return NextResponse.json(
          { error: `Invalid editable fields: ${invalidFields.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Update settings
    updateProfileSettings({
      allowViewProfile: allowViewProfile ?? undefined,
      allowEditProfile: allowEditProfile ?? undefined,
      allowChangePassword: allowChangePassword ?? undefined,
      editableFields: editableFields ?? undefined,
    });

    return NextResponse.json({
      settings: getProfileSettings(),
      success: true,
    });
  } catch (error) {
    console.error('Error updating profile settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
