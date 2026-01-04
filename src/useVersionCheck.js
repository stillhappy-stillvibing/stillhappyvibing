import { useState, useEffect } from 'react';

/**
 * Hook to check for app version updates
 * @param {string} currentVersion - The current app version
 * @param {number} checkInterval - How often to check for updates (in milliseconds)
 * @returns {Object} - { updateAvailable, newVersion, checkForUpdate }
 */
export const useVersionCheck = (currentVersion, checkInterval = 5 * 60 * 1000) => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersion, setNewVersion] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);

  const checkForUpdate = async () => {
    try {
      // Add cache-busting query parameter
      const timestamp = new Date().getTime();
      const response = await fetch(`/version.json?t=${timestamp}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        console.warn('Failed to fetch version info');
        return;
      }

      const data = await response.json();
      const serverVersion = data.version;

      // Compare versions
      if (serverVersion && serverVersion !== currentVersion) {
        console.log(`Update available: ${currentVersion} → ${serverVersion}`);
        setUpdateAvailable(true);
        setNewVersion(serverVersion);
      } else {
        setUpdateAvailable(false);
        setNewVersion(null);
      }

      setLastCheck(new Date());
    } catch (error) {
      console.warn('Error checking for updates:', error);
    }
  };

  useEffect(() => {
    // Check immediately on mount (after a short delay to not block initial render)
    const initialTimeout = setTimeout(() => {
      checkForUpdate();
    }, 10000); // Check 10 seconds after app loads

    // Then check periodically
    const interval = setInterval(() => {
      checkForUpdate();
    }, checkInterval);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [currentVersion, checkInterval]);

  return {
    updateAvailable,
    newVersion,
    lastCheck,
    checkForUpdate
  };
};
