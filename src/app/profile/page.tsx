'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '@/components/layout';
import { Avatar } from '@/components/common';
import { User, Mail, Phone, Globe, Clock, Shield, Save, AlertCircle } from 'lucide-react';
import type { UserProfile, UserProfileSettings } from '@/types';

const TIMEZONE_OPTIONS = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Australia/Sydney',
  'Pacific/Auckland',
];

const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
];

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserProfileSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    timezone: '',
    language: '',
  });

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setSettings(data.settings);
        setFormData({
          displayName: data.profile.displayName || '',
          phone: data.profile.phone || '',
          timezone: data.profile.timezone || '',
          language: data.profile.language || 'en',
        });
      } else if (response.status === 403) {
        setError('Profile viewing is disabled by your administrator');
      } else {
        setError('Failed to load profile');
      }
    } catch {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchProfile();
    }
  }, [session, fetchProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setSuccess('Profile updated successfully');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const isFieldEditable = (field: keyof UserProfile): boolean => {
    if (!settings?.allowEditProfile) return false;
    return settings.editableFields.includes(field);
  };

  if (status === 'loading' || loading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: 'var(--primary)' }}
          />
        </div>
      </MainLayout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Your Profile
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            View and manage your personal information
          </p>
        </div>

        {/* Profile Card */}
        <div className="card mb-6 p-6">
          {/* Avatar and basic info */}
          <div
            className="mb-6 flex items-center gap-4 border-b pb-6"
            style={{ borderColor: 'var(--border)' }}
          >
            <Avatar name={profile?.displayName || session.user?.name || ''} size="lg" />
            <div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {profile?.displayName || session.user?.name}
              </h2>
              <p className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                <Mail size={14} />
                {profile?.email || session.user?.email}
              </p>
              {profile?.ssoProvider && (
                <p
                  className="mt-1 flex items-center gap-2 text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Shield size={12} />
                  Signed in via {profile.ssoProvider}
                </p>
              )}
            </div>
          </div>

          {/* Error/Success messages */}
          {error && (
            <div
              className="mb-4 flex items-center gap-2 rounded-md p-3 text-sm"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--priority-urgent)' }}
            >
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          {success && (
            <div
              className="mb-4 flex items-center gap-2 rounded-md p-3 text-sm"
              style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--primary)' }}
            >
              <Save size={16} />
              {success}
            </div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Display Name */}
              <div>
                <label
                  htmlFor="displayName"
                  className="mb-1 flex items-center gap-2 text-sm font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <User size={14} />
                  Display Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  disabled={!isFieldEditable('displayName')}
                  className="input w-full"
                  placeholder="Enter your display name"
                />
                {!isFieldEditable('displayName') && (
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    This field is managed by your SSO provider
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="mb-1 flex items-center gap-2 text-sm font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Phone size={14} />
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isFieldEditable('phone')}
                  className="input w-full"
                  placeholder="Enter your phone number"
                />
              </div>

              {/* Timezone */}
              <div>
                <label
                  htmlFor="timezone"
                  className="mb-1 flex items-center gap-2 text-sm font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Clock size={14} />
                  Timezone
                </label>
                <select
                  id="timezone"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  disabled={!isFieldEditable('timezone')}
                  className="input w-full"
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div>
                <label
                  htmlFor="language"
                  className="mb-1 flex items-center gap-2 text-sm font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Globe size={14} />
                  Language
                </label>
                <select
                  id="language"
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  disabled={!isFieldEditable('language')}
                  className="input w-full"
                >
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            {settings?.allowEditProfile && (
              <div className="mt-6 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Password Section */}
        {settings?.allowChangePassword && (
          <div className="card p-6">
            <h3 className="mb-4 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Password
            </h3>
            <p className="mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Change your account password
            </p>
            <button className="btn-secondary">Change Password</button>
          </div>
        )}

        {/* SSO Notice */}
        {profile?.ssoProvider && !settings?.allowChangePassword && (
          <div className="card p-4" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
            <p
              className="flex items-center gap-2 text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Shield size={16} style={{ color: 'var(--primary)' }} />
              Your account is managed by {profile.ssoProvider}. Password changes must be made
              through your organization&apos;s identity provider.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
