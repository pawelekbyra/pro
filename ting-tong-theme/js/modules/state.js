const _state = {
  isUserLoggedIn:
    (typeof TingTongData !== "undefined" && TingTongData.isLoggedIn) ||
    false,
  currentLang: "pl",
  currentSlideIndex: 0,
  isAutoplayBlocked: false,
  lastFocusedElement: null,
  lastUserGestureTimestamp: 0,
  activeVideoSession: 0,
  commentSortOrder: "newest",
  replyingToComment: null,
  isSoundMuted: false,
};

export const State = {
  get: (key) => _state[key],
  set: (key, value) => {
    _state[key] = value;
  },
  getState: () => ({ ..._state }),
};