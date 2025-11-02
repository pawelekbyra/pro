// ============================================================================
// STATE MANAGER - Zarządzanie stanem aplikacji z Event Emitterem
// ============================================================================

const _state = {
  isUserLoggedIn:
    (typeof TingTongData !== "undefined" && TingTongData.isLoggedIn) ||
    false,
  currentUser: null,
  currentLang: "pl",
  currentSlideIndex: 0,
  isAutoplayBlocked: false,
  lastFocusedElement: null,
  lastUserGestureTimestamp: 0,
  activeVideoSession: 0,
  commentSortOrder: "newest",
  replyingToComment: null,
  isSoundMuted: false,
  videoPlaybackState: null,
  swiper: null,
};

const _listeners = {};

function on(event, callback) {
  if (!_listeners[event]) {
    _listeners[event] = [];
  }
  _listeners[event].push(callback);
}

function off(event, callback) {
  if (!_listeners[event]) return;
  _listeners[event] = _listeners[event].filter(cb => cb !== callback);
}

function emit(event, data) {
  if (!_listeners[event]) return;

  _listeners[event].forEach(callback => {
    setTimeout(() => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for "${event}":`, error);
      }
    }, 0);
  });
}

function get(key) {
  return _state[key];
}

function set(key, value, silent = false) {
  const oldValue = _state[key];
  _state[key] = value;

  if (!silent && oldValue !== value) {
    emit('state:change', { key, oldValue, newValue: value });
    emit(`state:change:${key}`, { oldValue, newValue: value });
  }
}

function getState() {
  return { ..._state };
}

function persist(keys = null) {
  const toPersist = keys || Object.keys(_state);
  const data = {};

  toPersist.forEach(key => {
    if (_state[key] !== undefined) {
      data[key] = _state[key];
    }
  });

  try {
    localStorage.setItem('tt_state', JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to persist state:', error);
  }
}

function restore(keys = null) {
  try {
    const stored = localStorage.getItem('tt_state');
    if (!stored) return;

    const data = JSON.parse(stored);
    const toRestore = keys || Object.keys(data);

    toRestore.forEach(key => {
      if (data[key] !== undefined) {
        set(key, data[key], true);
      }
    });
  } catch (error) {
    console.warn('Failed to restore state:', error);
  }
}

function clear(keys = null) {
  const toClear = keys || Object.keys(_state);

  toClear.forEach(key => {
    set(key, undefined, true);
  });

  try {
    localStorage.removeItem('tt_state');
  } catch (error) {
    console.warn('Failed to clear persisted state:', error);
  }
}

// Auto-persist
on('state:change:currentLang', ({ newValue }) => {
  persist(['currentLang']);
});

on('state:change:isSoundMuted', ({ newValue }) => {
  persist(['isSoundMuted']);
});

restore(['currentLang', 'isSoundMuted']);

export const State = {
  get,
  set,
  getState,
  on,
  off,
  emit,
  persist,
  restore,
  clear
};