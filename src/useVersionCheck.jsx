import { useState, useEffect } from 'react';

/**
 * Hook to check if a new version is available
 * Checks version.json every 5 minutes
 */
export const useVersionCheck = (currentVersion) => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersion, setNewVersion] = useState(null);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        // Add timestamp to prevent caching
        const response = await fetch(`/version.json?t=${Date.now()}`);
        const data = await response.json();

        if (data.version && data.version !== currentVersion) {
          setUpdateAvailable(true);
          setNewVersion(data.version);
        }
      } catch (error) {
        console.error('Version check failed:', error);
      }
    };

    // Check immediately
    checkVersion();

    // Check every 5 minutes
    const interval = setInterval(checkVersion, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentVersion]);

  return { updateAvailable, newVersion };
};
