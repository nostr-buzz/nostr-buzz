/**
 * PWA registration and management
 */

// Service Worker Registration
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      if (registration.installing) {
        console.log('Service worker installing');
      } else if (registration.waiting) {
        console.log('Service worker installed, waiting to activate');
      } else if (registration.active) {
        console.log('Service worker active');
      }
      
      // Set up service worker update check
      setupServiceWorkerUpdates(registration);
      
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  }
  return null;
}

// Function to check for service worker updates and handle them
function setupServiceWorkerUpdates(registration: ServiceWorkerRegistration) {
  if (!registration) return;
  
  // Check for updates periodically
  setInterval(() => {
    try {
      registration.update();
    } catch (e) {
      console.error('Error updating service worker:', e);
    }
  }, 60 * 60 * 1000); // Check every hour
  
  // Detect when an update is available
  let refreshing = false;
  
  // Handle controller change safely
  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      console.log('New service worker controller, refreshing page');
      window.location.reload();
    });
  }
  
  // Show notification when update is available
  if (registration) {
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateNotification();
        }
      });
    });
  }
}

// Show a notification when a new version of the app is available
function showUpdateNotification() {
  const notificationElement = document.getElementById('pwa-notification');
  if (!notificationElement) return;
  
  notificationElement.classList.remove('hidden');
  notificationElement.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
          <path d="M11 12H3"></path>
          <path d="M16 6H3"></path>
          <path d="M16 18H3"></path>
          <path d="M18 9v6"></path>
          <path d="M21 12h-3"></path>
        </svg>
        <div>
          <p class="font-medium">App update available</p>
          <p class="text-sm text-muted-foreground">A new version of Nostr Buzz is available</p>
        </div>
      </div>
      <div class="flex gap-2">
        <button id="pwa-update-dismiss" class="text-sm border rounded px-3 py-1 hover:bg-muted">
          Later
        </button>
        <button id="pwa-update-now" class="text-sm bg-primary text-primary-foreground rounded px-3 py-1 hover:bg-primary/90">
          Update Now
        </button>
      </div>
    </div>
  `;
  
  // Add event listeners to the buttons
  document.getElementById('pwa-update-dismiss')?.addEventListener('click', () => {
    notificationElement.classList.add('hidden');
  });
  
  document.getElementById('pwa-update-now')?.addEventListener('click', () => {
    window.location.reload();
  });
}

// Check if the app is installed or can be installed
export function checkInstallability() {
  // PWA installation event handler
  let deferredPrompt: any;
  const installButton = document.getElementById('pwa-install-button');
  
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 76+ from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show the install button if it exists
    if (installButton) {
      installButton.classList.remove('hidden');
      installButton.addEventListener('click', () => {
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
            installButton.classList.add('hidden');
          }
          // Reset the deferred prompt variable
          deferredPrompt = null;
        });
      });
    }
  });
  
  // Hide the install button when the PWA is installed
  window.addEventListener('appinstalled', () => {
    if (installButton) {
      installButton.classList.add('hidden');
    }
    console.log('PWA was installed');
    deferredPrompt = null;
  });
}

// Function to detect online/offline status and handle accordingly
export function setupNetworkStatusMonitoring() {
  const updateNetworkStatus = () => {
    const isOnline = navigator.onLine;
    // You can integrate this with your UI state management
    document.documentElement.dataset.networkStatus = isOnline ? 'online' : 'offline';
    
    if (!isOnline) {
      // Show an offline toast or notification
      console.log('You are offline. Some features may not be available.');
    } else {
      // Show an online toast or notification if previously offline
      if (document.documentElement.dataset.wasOffline === 'true') {
        console.log('You are back online!');
      }
    }
    
    document.documentElement.dataset.wasOffline = (!isOnline).toString();
  };
  
  // Check initial status
  updateNetworkStatus();
  
  // Add event listeners for changes
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
}

// Initialize all PWA functionality
export function initializePWA() {
  try {
    // Wrap in setTimeout to ensure DOM is fully loaded
    setTimeout(() => {
      registerServiceWorker();
      checkInstallability();
      setupNetworkStatusMonitoring();
    }, 1000);
  } catch (e) {
    console.error('Error initializing PWA:', e);
  }
}

// Export a default function for easy import
export default initializePWA;
