import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getProfileSettings } from '@/lib/profile-settings';
import type { UserProfile, ProfileUpdateRequest } from '@/types';

// In-memory storage for profile data (in production, use a database)
const profileStore: Map<string, Partial<UserProfile>> = new Map();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileSettings = getProfileSettings();

    if (!profileSettings.allowViewProfile) {
      return NextResponse.json({ error: 'Profile viewing is disabled' }, { status: 403 });
    }

    // Get stored profile overrides
    const storedProfile = profileStore.get(session.user.email) || {};

    // Build profile from session + stored data
    const profile: UserProfile = {
      id: session.user.id || session.user.email,
      displayName: storedProfile.displayName || session.user.name || '',
      email: session.user.email,
      phone: storedProfile.phone || '',
      timezone: storedProfile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      avatarUrl: session.user.image || undefined,
      language: storedProfile.language || 'en',
      ssoProvider: 'Azure AD',
      updatedAt: storedProfile.updatedAt,
    };

    return NextResponse.json({
      profile,
      settings: profileSettings,
      success: true,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileSettings = getProfileSettings();

    if (!profileSettings.allowEditProfile) {
      return NextResponse.json({ error: 'Profile editing is disabled' }, { status: 403 });
    }

    const body: ProfileUpdateRequest = await request.json();

    // Validate displayName length if provided
    if (body.displayName !== undefined) {
      if (body.displayName.length === 0) {
        return NextResponse.json({ error: 'Display name cannot be empty' }, { status: 400 });
      }
      if (body.displayName.length > 50) {
        return NextResponse.json(
          { error: 'Display name must be 50 characters or less' },
          { status: 400 }
        );
      }
    }

    // Validate that only allowed fields are being updated
    const updateKeys = Object.keys(body) as (keyof ProfileUpdateRequest)[];
    const disallowedFields = updateKeys.filter(
      (key) => !profileSettings.editableFields.includes(key as keyof UserProfile)
    );

    if (disallowedFields.length > 0) {
      return NextResponse.json(
        { error: `Cannot edit fields: ${disallowedFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Get existing stored profile
    const existingProfile = profileStore.get(session.user.email) || {};

    // Merge updates
    const updatedProfile: Partial<UserProfile> = {
      ...existingProfile,
      ...body,
      updatedAt: new Date(),
    };

    // Store the updated profile
    profileStore.set(session.user.email, updatedProfile);

    // Build full profile response
    const profile: UserProfile = {
      id: session.user.id || session.user.email,
      displayName: updatedProfile.displayName || session.user.name || '',
      email: session.user.email,
      phone: updatedProfile.phone || '',
      timezone: updatedProfile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      avatarUrl: session.user.image || undefined,
      language: updatedProfile.language || 'en',
      ssoProvider: 'Azure AD',
      updatedAt: updatedProfile.updatedAt,
    };

    return NextResponse.json({
      profile,
      success: true,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
