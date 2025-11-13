import { Utils } from './utils.js';
import { UI } from './ui.js';

const DOM = {};
let isVisible = false;

const mockNotifications = [
    {
        id: 1,
        type: 'like',
        user: 'Alicja',
        preview: 'polubiła Twój film.',
        time: '2h',
        read: false,
        icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'
    },
    {
        id: 2,
        type: 'comment',
        user: 'Paweł',
        preview: 'skomentował: "Niesamowite! 🚀"',
        time: '5h',
        read: false,
        icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/></svg>'
    },
    {
        id: 3,
        type: 'follow',
        user: 'Katarzyna',
        preview: 'zaczęła Cię obserwować.',
        time: '1d',
        read: true,
        icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>'
    },
    {
        id: 4,
        type: 'system',
        preview: 'Witamy w Ting Tong! Odkryj nowe treści.',
        time: '3d',
        read: true,
        icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
    }
];

function cacheDOM() {
    DOM.popup = document.getElementById('notificationPopup');
    DOM.list = DOM.popup ? DOM.popup.querySelector('.notification-list') : null;
    DOM.emptyState = DOM.popup ? DOM.popup.querySelector('.notification-empty-state') : null;
    DOM.notificationDot = document.querySelector('.notification-dot');
}

function renderNotifications() {
    if (!DOM.list) return;

    if (mockNotifications.length === 0) {
        DOM.emptyState.classList.remove('hidden-by-js');
        DOM.list.innerHTML = '';
        DOM.list.appendChild(DOM.emptyState);
        return;
    }

    DOM.emptyState.classList.add('hidden-by-js');
    DOM.list.innerHTML = ''; // Clear previous notifications

    mockNotifications.forEach(notif => {
        const item = document.createElement('li');
        item.className = `notification-item ${!notif.read ? 'unread' : ''}`;
        item.dataset.notifId = notif.id;

        const previewText = notif.user ? `<strong>${notif.user}</strong> ${notif.preview}` : notif.preview;

        item.innerHTML = `
            <div class="notif-header">
                <div class="notif-icon">${notif.icon}</div>
                <div class="notif-content-wrapper">
                    <div class="notif-summary">
                        <span class="notif-preview">${previewText}</span>
                        <span class="notif-time">${notif.time}</span>
                    </div>
                    ${!notif.read ? '<div class="unread-dot"></div>' : ''}
                </div>
            </div>
        `;
        DOM.list.appendChild(item);
    });

    const hasUnread = mockNotifications.some(n => !n.read);
    if (DOM.notificationDot) {
        DOM.notificationDot.style.display = hasUnread ? 'block' : 'none';
    }
}

function showPopup() {
    if (!DOM.popup) return;
    renderNotifications();
    DOM.popup.classList.add('visible');
    isVisible = true;
    if (DOM.notificationDot) {
        DOM.notificationDot.style.display = 'none';
    }
}

function hidePopup() {
    if (!DOM.popup) return;
    DOM.popup.classList.remove('visible');
    isVisible = false;
}

function toggleNotifications() {
    if (isVisible) {
        hidePopup();
    } else {
        showPopup();
    }
}

export const Notifications = {
  init() {
    cacheDOM();
    if (!DOM.popup) {
        console.warn('Notification popup not found. Module not initialized.');
        return;
    }
    // Initial check for unread notifications
    renderNotifications();
  },
  toggle: toggleNotifications,
  hide: hidePopup
};