'use client';

import { useCallback } from 'react';
import { useOrganization } from '@/components/providers/OrganizationProvider';

interface FetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
}

/**
 * Custom hook for making Azure DevOps API calls with automatic organization header injection.
 * Centralizes the pattern of including x-devops-org header in all DevOps API requests.
 */
export function useDevOpsApi() {
  const { selectedOrganization } = useOrganization();

  /**
   * Fetch wrapper that automatically adds the x-devops-org header
   * @param url - API endpoint URL
   * @param options - Standard fetch options
   * @returns Promise with fetch response
   */
  const fetchDevOps = useCallback(
    async (url: string, options: FetchOptions = {}): Promise<Response> => {
      const headers: Record<string, string> = {
        ...options.headers,
      };

      if (selectedOrganization?.accountName) {
        headers['x-devops-org'] = selectedOrganization.accountName;
      }

      return fetch(url, {
        ...options,
        headers,
      });
    },
    [selectedOrganization]
  );

  /**
   * GET request with DevOps organization header
   */
  const get = useCallback(
    async (url: string, options: FetchOptions = {}): Promise<Response> => {
      return fetchDevOps(url, { ...options, method: 'GET' });
    },
    [fetchDevOps]
  );

  /**
   * POST request with DevOps organization header
   */
  const post = useCallback(
    async (url: string, body: unknown, options: FetchOptions = {}): Promise<Response> => {
      return fetchDevOps(url, {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify(body),
      });
    },
    [fetchDevOps]
  );

  /**
   * PATCH request with DevOps organization header
   */
  const patch = useCallback(
    async (url: string, body: unknown, options: FetchOptions = {}): Promise<Response> => {
      return fetchDevOps(url, {
        ...options,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify(body),
      });
    },
    [fetchDevOps]
  );

  return {
    fetchDevOps,
    get,
    post,
    patch,
    selectedOrganization,
    hasOrganization: !!selectedOrganization,
  };
}
