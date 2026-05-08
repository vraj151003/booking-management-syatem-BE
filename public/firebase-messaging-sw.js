// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase config will be set dynamically from the main page
let firebaseConfig = null;
let messaging = null;

// Listen for messages from the main page to set Firebase config
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'FIREBASE_CONFIG') {
        firebaseConfig = event.data.config;
        try {
            // Delete existing app if already initialized to prevent using stale dummy credentials
            if (firebase.apps.length > 0) {
                firebase.app().delete().then(() => {
                    firebase.initializeApp(firebaseConfig);
                    messaging = firebase.messaging();
                    console.log('[SW] Firebase re-initialized successfully with new config');
                });
            } else {
                firebase.initializeApp(firebaseConfig);
                messaging = firebase.messaging();
                console.log('[SW] Firebase initialized successfully');
            }
        } catch (error) {
            console.error('[SW] Firebase initialization error:', error);
        }
    }
});

// Initialize messaging when service worker activates
self.addEventListener('activate', function(event) {
    event.waitUntil(self.clients.claim());
    console.log('[SW] Service Worker activated');
});

// Handle background messages
function setupBackgroundMessageHandler() {
    if (messaging) {
        messaging.onBackgroundMessage(function(payload) {
            console.log('[SW] Received background message ', payload);
            
            // Customize notification here
            const notificationTitle = payload.notification.title;
            const notificationOptions = {
                body: payload.notification.body,
                icon: '/firebase-logo.png',
                data: payload.data,
                actions: [
                    {
                        action: 'open',
                        title: 'Open App'
                    }
                ]
            };

            self.registration.showNotification(notificationTitle, notificationOptions);
        });
        console.log('[SW] Background message handler setup complete');
    } else {
        console.log('[SW] Messaging not ready, retrying in 1 second...');
        setTimeout(setupBackgroundMessageHandler, 1000);
    }
}

// Setup background message handler
setupBackgroundMessageHandler();

// Handle notification click
self.addEventListener('notificationclick', function(event) {
    console.log('Notification click received.');
    
    event.notification.close();
    
    if (event.action === 'open') {
        // Open your app or specific page
        event.waitUntil(
            clients.openWindow('http://localhost:5001/fcm-token-generator.html')
        );
    } else {
        // Default click behavior
        event.waitUntil(
            clients.openWindow('http://localhost:5001/fcm-token-generator.html')
        );
    }
});

// Handle push events (fallback)
self.addEventListener('push', function(event) {
    console.log('Push event received:', event);
    
    if (event.data) {
        const data = event.data.json();
        const title = data.title || 'New Notification';
        const options = {
            body: data.body || 'You have a new message',
            icon: '/firebase-logo.png',
            badge: '/firebase-badge.png',
            data: data.data || {},
            requireInteraction: true
        };
        
        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    }
});

// Service worker installation
self.addEventListener('install', function(event) {
    console.log('Service Worker installing.');
    self.skipWaiting();
});

// Service worker activation
self.addEventListener('activate', function(event) {
    console.log('Service Worker activating.');
    event.waitUntil(self.clients.claim());
});
