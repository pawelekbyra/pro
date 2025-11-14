import { Config } from './config.js';
import { State } from './state.js';

export const Utils = {
  /**
   * Retrieves a translation string for a given key based on the current language.
   * @param {string} key - The key of the translation string to retrieve.
   * @returns {string} The translated string, or the key itself if no translation is found.
   */
  getTranslation: (key) =>
    Config.TRANSLATIONS[State.get("currentLang")]?.[key] || key,
  /**
   * Formats a number into a compact, human-readable string (e.g., 1.2K, 5M).
   * @param {number} count - The number to format.
   * @returns {string} The formatted string representation of the number.
   */
  formatCount: (count) => {
    count = Number(count) || 0;
    if (count >= 1000000)
      return (count / 1000000).toFixed(1).replace(".0", "") + "M";
    if (count >= 1000)
      return (count / 1000).toFixed(1).replace(".0", "") + "K";
    return String(count);
  },
  fixProtocol: (url) => {
    if (!url) return url;
    try {
      if (window.location.protocol === "https:") {
        const urlObj = new URL(url, window.location.origin);
        if (urlObj.protocol === "http:") {
          urlObj.protocol = "https:";
          return urlObj.toString();
        }
      }
    } catch (e) {
      /* Invalid URL, return as is */
    }
    return url;
  },
  toRelativeIfSameOrigin: (url) => {
    if (!url) return url;
    try {
      const urlObj = new URL(url, window.location.origin);
      if (urlObj.origin === window.location.origin) {
        return urlObj.pathname + urlObj.search + urlObj.hash;
      }
    } catch (e) {
      /* Invalid URL, return as is */
    }
    return url;
  },
  vibrateTry: (ms = 35) => {
    if (navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch (e) {}
    }
  },
  recordUserGesture: () => {
    State.set("lastUserGestureTimestamp", Date.now());
  },
  setAppHeightVar: () => {
    document.documentElement.style.setProperty(
      "--app-height",
      `${window.innerHeight}px`,
    );
  },

  /**
   * Formats a timestamp into a relative time string (e.g., "5m ago", "yesterday").
   * @param {string | Date} timestamp - The timestamp to format.
   * @returns {string} The formatted relative time string.
   */
  formatTimeAgo: (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);

    const lang = State.get("currentLang") || 'pl';
    const translations = Config.TRANSLATIONS[lang];

    if (seconds < 60) return translations.timeJustNow || 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}${translations.timeMinute || 'm'}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}${translations.timeHour || 'h'}`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}${translations.timeDay || 'd'}`;

    // For older dates, return a simple date format
    return date.toLocaleDateString(lang, { month: 'short', day: 'numeric' });
  },

  isValidEmail: (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  },

  /**
   * Konwertuje klucz VAPID z formatu URL-safe base64 na Uint8Array.
   * @param {string} base64String Klucz w formacie base64.
   * @returns {Uint8Array}
   */
  urlBase64ToUint8Array: (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },
};