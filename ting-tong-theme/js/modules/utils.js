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
};