importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyBWFWL1x8d3DDUDl8c5Cc2bSYD9KFkeWck",
    authDomain: "mentoros-app.firebaseapp.com",
    projectId: "mentoros-app",
    storageBucket: "mentoros-app.firebasestorage.app",
    messagingSenderId: "746245767069",
    appId: "1:746245767069:web:7a700546c7c50a2dd4f974"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icon-192x192.png' // Ensure this icon exists or use a default
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
