'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * React hook to fetch and manage the user's profile photo from Azure DevOps.
 * Returns the photo URL (or null) and loading state.
 */
export function useProfilePhoto(isAuthenticated: boolean) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const photoUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setPhotoUrl(null);
      return;
    }

    let isMounted = true;

    async function fetchPhoto() {
      setIsLoading(true);
      try {
        // Use the avatar API endpoint which proxies to Azure DevOps
        const response = await fetch('/api/devops/avatar');
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          if (isMounted) {
            photoUrlRef.current = url;
            setPhotoUrl(url);
          }
        }
      } catch {
        // Silently fail - profile photo is non-critical
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchPhoto();

    return () => {
      isMounted = false;
      // Revoke the object URL to prevent memory leaks
      if (photoUrlRef.current) {
        URL.revokeObjectURL(photoUrlRef.current);
      }
    };
  }, [isAuthenticated]);

  return { photoUrl, isLoading };
}
