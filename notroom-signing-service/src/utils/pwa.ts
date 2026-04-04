/**
 * Progressive Web App (PWA) Utilities
 * Handles service worker registration and PWA install prompts
 */

import { logger } from './logger';

// Register service worker with automatic updates
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    // Unregister service worker in development
    if (import.meta.env.DEV) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
          logger.log('Service Worker unregistered in development');
        });
      });
      return;
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', {
          // Update service worker immediately when new version is available
          updateViaCache: 'none'
        })
        .then((registration) => {
          logger.log('Service Worker registered:', registration.scope);
          
          // Check for updates immediately and periodically
          const checkForUpdates = () => {
            registration.update().catch((error) => {
              logger.warn('Service Worker update check failed:', error);
            });
          };

          // Check for updates immediately
          checkForUpdates();

          // Check for updates every 5 minutes
          setInterval(checkForUpdates, 5 * 60 * 1000);

          // Handle update found
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New service worker available - force reload
                    logger.log('New service worker available, reloading...');
                    // Reload after a short delay to allow the new worker to activate
                    setTimeout(() => {
                      window.location.reload();
                    }, 100);
                  } else {
                    // First time installation
                    logger.log('Service Worker installed for the first time');
                  }
                }
              });
            }
          });

          // Handle controller change (new service worker took control)
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            logger.log('Service Worker controller changed, reloading...');
            window.location.reload();
          });
        })
        .catch((error) => {
          logger.error('Service Worker registration failed:', error);
        });
    });
  }
};

// Handle PWA install prompt
export const handleInstallPrompt = () => {
  let deferredPrompt: BeforeInstallPromptEvent | null = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;

    // Show custom install button/prompt
    // You can trigger this from a component
    logger.log('PWA install prompt available');
  });

  return {
    prompt: async () => {
      if (!deferredPrompt) {
        return false;
      }

      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for user response
      const { outcome } = await deferredPrompt.userChoice;
      
      deferredPrompt = null;
      
      return outcome === 'accepted';
    },
    isAvailable: () => !!deferredPrompt,
  };
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

