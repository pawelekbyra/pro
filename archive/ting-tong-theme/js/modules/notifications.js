import { Utils } from './utils.js';

const mockNotifications = [
    {
        id: 1,
        type: 'new_follower',
        user: 'Anna Kowalska',
        preview: 'zaczęła Cię obserwować.',
        details: 'Anna Kowalska, znana z pasji do podróży, teraz śledzi Twoje przygody!',
        timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        isRead: false
    },
    {
        id: 2,
        type: 'comment_like',
        user: 'Piotr Nowak',
        preview: 'polubił Twój komentarz: "Świetne ujęcie!"',
        details: 'Twój komentarz pod filmem "Zachód słońca nad Bałtykiem" zdobył polubienie od Piotra Nowaka.',
        timestamp: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
        isRead: false
    },
    {
        id: 3,
        type: 'new_feature',
        preview: 'Nowa funkcja: Tryb Ciemny jest już dostępny!',
        details: 'Odkryj nowy, elegancki wygląd aplikacji. Przejdź do ustawień, aby włączyć Tryb Ciemny i cieszyć się komfortem oglądania w nocy.',
        timestamp: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
        isRead: true
    },
    {
        id: 4,
        type: 'reply',
        user: 'Katarzyna Wiśniewska',
        preview: 'odpowiedziała na Twój komentarz.',
        details: 'Katarzyna Wiśniewska odpowiedziała na Twój komentarz pod filmem "Poradnik fotograficzny": "Dzięki za radę! Spróbuję tego ustawienia następnym razem."',
        timestamp: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
        isRead: true
    }
];

function getIconForType(type) {
    switch (type) {
        case 'new_follower':
            return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3.75m-7.5-3.75v3.75m-7.5-3.75v3.75m0 0h15M5.25 7.5h13.5m-13.5 0V11.25m13.5 0V7.5m0 3.75v3.75M5.25 11.25v3.75m13.5 0v3.75M5.25 15v3.75M12 18.75v3.75M18.75 18.75v3.75" /></svg>';
        case 'comment_like':
            return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>';
        case 'new_feature':
            return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 005.026-2.316m-5.026 2.316a3 3 0 01-3.373 0 3 3 0 01-3.373 0M1.34 6.378a3 3 0 01/3.373 0 3 3 0 013.373 0m-3.373 0c.163.221.354.425.566.606m-5.026-2.316a15.998 15.998 0 015.026 2.316m0 0a3 3 0 013.373 0 3 3 0 013.373 0" /></svg>';
        case 'reply':
            return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-2.625 7.5a.75.75 0 00-1.5 0v.041a.75.75 0 001.5 0v-.041zM10.125 12a.75.75 0 00-1.5 0v.041a.75.75 0 001.5 0v-.041zM12 14.25a.75.75 0 000 1.5h.041a.75.75 0 000-1.5h-.041zM14.625 12a.75.75 0 00-1.5 0v.041a.75.75 0 001.5 0v-.041zM16.125 9.75a.75.75 0 00-1.5 0v.041a.75.75 0 001.5 0v-.041z" clip-rule="evenodd" /></svg>';
        default:
            return '';
    }
}

function createNotificationItem(notification) {
    const li = document.createElement('li');
    li.className = `notification-item ${notification.isRead ? '' : 'unread'}`;
    li.dataset.notificationId = notification.id;

    let previewText = '';
    if (notification.user) {
        previewText = `<strong>${notification.user}</strong> ${notification.preview}`;
    } else {
        previewText = notification.preview;
    }

    li.innerHTML = `
        <div class="notif-header">
            <div class="notif-icon">${getIconForType(notification.type)}</div>
            <div class="notif-content-wrapper">
                <div class="notif-summary">
                    <span class="notif-preview">${previewText}</span>
                    <span class="notif-time">${Utils.formatTimeAgo(notification.timestamp)}</span>
                </div>
                <div class="unread-dot"></div>
                <svg class="expand-chevron" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </div>
        </div>
        <div class="notif-full-details">
            <div class="notif-full-details-content">
                ${notification.details}
            </div>
        </div>
    `;

    li.querySelector('.notif-header').addEventListener('click', () => {
        li.classList.toggle('expanded');
        if (!notification.isRead) {
            notification.isRead = true;
            li.classList.remove('unread');
            // Here you would typically also update the state on the server
        }
    });

    return li;
}

function renderNotifications() {
    const list = document.querySelector('.notification-list');
    const emptyState = document.querySelector('.notification-empty-state');
    if (!list || !emptyState) return;

    list.innerHTML = '';
    if (mockNotifications.length === 0) {
        emptyState.classList.remove('hidden-by-js');
    } else {
        emptyState.classList.add('hidden-by-js');
        mockNotifications.forEach(n => {
            list.appendChild(createNotificationItem(n));
        });
    }
}

export const Notifications = {
    init() {
        renderNotifications();
    },
};
