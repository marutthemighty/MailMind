const CACHE_NAME = 'mailassist-pro-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Add to cache for future use
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Return offline page if available in cache
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
  );
});

// Background sync for sending emails when back online
self.addEventListener('sync', (event) => {
  if (event.tag === 'send-email') {
    event.waitUntil(sendQueuedEmails());
  }
});

// Push notifications for new emails
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'You have new emails',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'email-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Email',
        icon: '/icons/view-action.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-action.png'
      }
    ],
    data: {
      url: '/',
      timestamp: Date.now()
    }
  };

  event.waitUntil(
    self.registration.showNotification('MailAssist Pro', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Utility function to send queued emails
async function sendQueuedEmails() {
  try {
    // Get queued emails from IndexedDB or localStorage
    const queuedEmails = await getQueuedEmails();
    
    for (const email of queuedEmails) {
      try {
        const response = await fetch('/api/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(email)
        });

        if (response.ok) {
          await removeFromQueue(email.id);
        }
      } catch (error) {
        console.error('Failed to send queued email:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper functions for email queue management
async function getQueuedEmails() {
  return new Promise((resolve) => {
    const request = indexedDB.open('MailAssistDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['emailQueue'], 'readonly');
      const objectStore = transaction.objectStore('emailQueue');
      const getAllRequest = objectStore.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result);
      };
    };
    
    request.onerror = () => {
      resolve([]);
    };
  });
}

async function removeFromQueue(emailId) {
  return new Promise((resolve) => {
    const request = indexedDB.open('MailAssistDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['emailQueue'], 'readwrite');
      const objectStore = transaction.objectStore('emailQueue');
      
      objectStore.delete(emailId);
      resolve();
    };
  });
}

// Periodic background sync for email updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'email-sync') {
    event.waitUntil(syncEmails());
  }
});

async function syncEmails() {
  try {
    // Fetch latest emails when app is in background
    const response = await fetch('/api/emails/sync', {
      method: 'GET',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      
      // Show notification for new emails
      if (data.newEmails && data.newEmails.length > 0) {
        self.registration.showNotification('New Emails', {
          body: `You have ${data.newEmails.length} new email(s)`,
          icon: '/icons/icon-192x192.png',
          tag: 'new-emails'
        });
      }
    }
  } catch (error) {
    console.error('Email sync failed:', error);
  }
}
