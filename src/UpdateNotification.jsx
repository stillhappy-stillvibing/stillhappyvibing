import { useState, useEffect } from 'react';

/**
 * Notification banner that appears when an app update is available
 */
const UpdateNotification = ({ isVisible, newVersion, onUpdate, onDismiss }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Slight delay for animation
      setTimeout(() => setShow(true), 100);
    } else {
      setShow(false);
    }
  }, [isVisible]);

  const handleUpdate = () => {
    // Clear all caches and reload
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
        });
      });
    }

    // Clear browser cache and reload
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    }).finally(() => {
      window.location.reload(true);
    });
  };

  const handleDismiss = () => {
    setShow(false);
    setTimeout(() => {
      if (onDismiss) onDismiss();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
        show ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-wrap">
            <div className="flex items-center flex-1">
              <span className="flex p-2 rounded-lg bg-white/20">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </span>
              <p className="ml-3 font-medium">
                <span className="inline">
                  A new version is available! {newVersion && `(v${newVersion})`}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3 mt-3 sm:mt-0">
              <button
                onClick={handleUpdate}
                className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-purple-50 transition-colors shadow-md"
              >
                Update Now
              </button>
              <button
                onClick={handleDismiss}
                className="text-white/90 hover:text-white px-2 py-2"
                aria-label="Dismiss"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;
