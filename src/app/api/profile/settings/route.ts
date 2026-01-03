import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { UserProfileSettings, UserProfile } from '@/types';

// In-memory settings store (in production, use a database)
let profileSettings: UserProfileSettings = {
  allowViewProfile: true,
  allowEditProfile: true,
  allowChangePassword: false,
  editableFields: ['displayName', 'phone', 'timezone', 'language'],
};

// Simple admin check - in production, implement proper role-based access
function isAdmin(email: string): boolean {
  // For now, consider all authenticated users as having access
  // In production, check against admin roles in Azure AD or database
  return !!email;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      settings: profileSettings,
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
    const validFields: (keyof UserProfile)[] = ['displayName', 'phone', 'timezone', 'language'];

    if (editableFields) {
      const invalidFields = editableFields.filter(
        (field: string) => !validFields.includes(field as keyof UserProfile)
      );
      if (invalidFields.length > 0) {
        return NextResponse.json(
          { error: `Invalid editable fields: ${invalidFields.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Update settings
    profileSettings = {
      allowViewProfile: allowViewProfile ?? profileSettings.allowViewProfile,
      allowEditProfile: allowEditProfile ?? profileSettings.allowEditProfile,
      allowChangePassword: allowChangePassword ?? profileSettings.allowChangePassword,
      editableFields: editableFields ?? profileSettings.editableFields,
    };

    return NextResponse.json({
      settings: profileSettings,
      success: true,
    });
  } catch (error) {
    console.error('Error updating profile settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
