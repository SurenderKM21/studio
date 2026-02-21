
'use client';

/**
 * A strongly-typed pub/sub event emitter for JavaScript.
 */
function createEventEmitter() {
  const events = {};

  return {
    on(eventName, callback) {
      if (!events[eventName]) {
        events[eventName] = [];
      }
      events[eventName].push(callback);
    },

    off(eventName, callback) {
      if (!events[eventName]) {
        return;
      }
      events[eventName] = events[eventName].filter(cb => cb !== callback);
    },

    emit(eventName, data) {
      if (!events[eventName]) {
        return;
      }
      events[eventName].forEach(callback => callback(data));
    },
  };
}

export const errorEmitter = createEventEmitter();
