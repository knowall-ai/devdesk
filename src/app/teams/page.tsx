'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout';
import { Avatar, LoadingSpinner } from '@/components/common';
import { Users, Activity, AlertCircle } from 'lucide-react';
import { ActivityCalendar, type Activity as CalendarActivity } from 'react-activity-calendar';
import type { User } from '@/types';

interface TeamActivityData {
  activities: CalendarActivity[];
  members: User[];
  totalActivities: number;
}

export default function TeamsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activityData, setActivityData] = useState<TeamActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchTeamActivity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const memberParam = selectedMember !== 'all' ? `?member=${selectedMember}` : '';
      const response = await fetch(`/api/devops/team-activity${memberParam}`);
      if (response.ok) {
        const data = await response.json();
        setActivityData(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to load team activity data');
      }
    } catch (err) {
      console.error('Failed to fetch team activity:', err);
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedMember]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchTeamActivity();
    }
  }, [session, selectedMember, fetchTeamActivity]);

  if (status === 'loading') {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  if (!session) {
    return null;
  }

  const selectedMemberData =
    selectedMember !== 'all' ? activityData?.members.find((m) => m.id === selectedMember) : null;

  return (
    <MainLayout>
      <div className="flex h-full">
        {/* Sidebar */}
        <div
          className="w-64 border-r p-4"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
            Filter by member
          </h2>
          <nav className="space-y-1">
            <button
              onClick={() => setSelectedMember('all')}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                selectedMember === 'all'
                  ? 'bg-[rgba(34,197,94,0.15)] text-[var(--primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <Users size={16} />
              All team members
            </button>
            {activityData?.members.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedMember(member.id)}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  selectedMember === member.id
                    ? 'bg-[rgba(34,197,94,0.15)] text-[var(--primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                <Avatar name={member.displayName} image={member.avatarUrl} size="sm" />
                <span className="truncate">{member.displayName}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="mb-2 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Teams
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              View team activity across all projects over the last year.
            </p>
          </div>

          {/* Activity Chart */}
          <div className="card">
            <div className="border-b p-4" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {selectedMemberData ? selectedMemberData.displayName : 'Team'} Activity
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {activityData?.totalActivities || 0} activities in the last year
                  </p>
                </div>
                <div
                  className="rounded-lg p-3"
                  style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: 'var(--primary)' }}
                >
                  <Activity size={24} />
                </div>
              </div>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="flex h-48 items-center justify-center">
                  <LoadingSpinner size="lg" message="Loading activity data..." />
                </div>
              ) : error ? (
                <div
                  className="flex h-48 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'var(--surface-hover)' }}
                >
                  <div className="text-center">
                    <AlertCircle
                      size={48}
                      style={{ color: 'var(--priority-urgent)', margin: '0 auto' }}
                    />
                    <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {error}
                    </p>
                    <button
                      onClick={fetchTeamActivity}
                      className="btn-secondary mt-4"
                      style={{ cursor: 'pointer' }}
                    >
                      Try again
                    </button>
                  </div>
                </div>
              ) : activityData?.activities && activityData.activities.length > 0 ? (
                <div className="overflow-x-auto">
                  <ActivityCalendar
                    data={activityData.activities}
                    blockSize={12}
                    blockMargin={4}
                    blockRadius={2}
                    fontSize={12}
                    colorScheme="dark"
                    theme={{
                      dark: [
                        'var(--surface)',
                        'var(--primary-dark)',
                        'var(--primary-hover)',
                        'var(--primary)',
                        'var(--primary-light)',
                      ],
                    }}
                    labels={{
                      totalCount: '{{count}} activities in {{year}}',
                    }}
                    showWeekdayLabels
                  />
                </div>
              ) : (
                <div
                  className="flex h-48 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'var(--surface-hover)' }}
                >
                  <div className="text-center">
                    <Activity size={48} style={{ color: 'var(--text-muted)', margin: '0 auto' }} />
                    <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                      No activity data available
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Team Members List */}
          <div className="card mt-6">
            <div className="border-b p-4" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Team Members
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {activityData?.members.length || 0} members across all projects
              </p>
            </div>
            <div className="p-4">
              {loading ? (
                <LoadingSpinner size="md" message="Loading team members..." />
              ) : activityData?.members && activityData.members.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {activityData.members.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedMember(member.id)}
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                        selectedMember === member.id
                          ? 'border-[var(--primary)] bg-[rgba(34,197,94,0.1)]'
                          : 'border-[var(--border)] hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      <Avatar name={member.displayName} image={member.avatarUrl} size="md" />
                      <div className="min-w-0 text-left">
                        <p
                          className="truncate font-medium"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {member.displayName}
                        </p>
                        <p className="truncate text-sm" style={{ color: 'var(--text-muted)' }}>
                          {member.email}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center" style={{ color: 'var(--text-muted)' }}>
                  No team members found
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
