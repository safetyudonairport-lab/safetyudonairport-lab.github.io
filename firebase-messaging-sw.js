// ==========================================
// Firebase Messaging Service Worker
// สำหรับรับ Push Notification เบื้องหลัง (รวม iOS PWA)
// ==========================================

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// ★★★ ใส่ Firebase Config เดียวกับในหน้าเว็บ ★★★
firebase.initializeApp({
  apiKey: "AIzaSyAY0vYjBf2Mc_p8z5eU1uR_2jujMk7zLTw",
  authDomain: "approve-safety-system.firebaseapp.com",
  projectId: "approve-safety-system",
  storageBucket: "approve-safety-system.firebasestorage.app",
  messagingSenderId: "602722012670",
  appId: "1:602722012670:web:62207d57b1f0f147e584af"
});

const messaging = firebase.messaging();

// ==========================================
// Background Message Handler
// จะทำงานเมื่อ App ไม่ได้เปิดอยู่ (background / closed)
// ★ สำคัญมากสำหรับ iOS PWA ★
// ==========================================
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'ระบบคำขออนุญาต';
  const notificationOptions = {
    body: payload.notification?.body || 'มีการอัปเดตใหม่',
    icon: 'https://img.icons8.com/parakeet/480/document.png',
    badge: 'https://img.icons8.com/parakeet/480/document.png',
    vibrate: [200, 100, 200],
    tag: payload.data?.requestId || 'general',
    renotify: true,
    requireInteraction: true,
    data: payload.data || {},
    actions: [
      { action: 'open', title: 'เปิดดู' },
      { action: 'close', title: 'ปิด' }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// ==========================================
// Notification Click Handler
// เมื่อผู้ใช้กดที่ Notification
// ==========================================
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  event.notification.close();

  if (event.action === 'close') return;

  // เปิดหน้าเว็บหรือ focus ไปที่หน้าที่เปิดอยู่
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // ถ้ามีหน้าเว็บเปิดอยู่แล้ว ให้ focus ไปที่นั่น
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            data: event.notification.data
          });
          return client.focus();
        }
      }
      // ถ้าไม่มีหน้าเว็บเปิดอยู่ ให้เปิดหน้าใหม่
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});

// ==========================================
// Push Event Handler (สำรอง)
// สำหรับกรณีที่ onBackgroundMessage ไม่ทำงาน
// ==========================================
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    console.log('[SW] Push event:', payload);

    // ถ้า FCM จัดการ notification แล้ว ไม่ต้องแสดงซ้ำ
    if (payload.notification) return;

    // แสดง notification จาก data-only message
    if (payload.data) {
      const title = payload.data.title || 'ระบบคำขออนุญาต';
      const options = {
        body: payload.data.body || 'มีการอัปเดตใหม่',
        icon: 'https://img.icons8.com/parakeet/480/document.png',
        badge: 'https://img.icons8.com/parakeet/480/document.png',
        vibrate: [200, 100, 200],
        tag: payload.data.requestId || 'general',
        renotify: true,
        data: payload.data
      };
      event.waitUntil(self.registration.showNotification(title, options));
    }
  } catch (e) {
    console.log('[SW] Push parse error:', e);
  }
});

// ==========================================
// Service Worker Install & Activate
// ==========================================
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activated');
  event.waitUntil(clients.claim());
});