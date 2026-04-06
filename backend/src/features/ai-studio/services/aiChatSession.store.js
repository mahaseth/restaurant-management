/** In-memory chat sessions for public AI chat (sessionId -> state). */

const store = new Map();
const MAX_MESSAGES = 80;
const TTL_MS = 1000 * 60 * 60 * 24; // 24h

function prune() {
  const now = Date.now();
  for (const [id, s] of store.entries()) {
    if (now - s.updatedAt > TTL_MS) store.delete(id);
  }
}

setInterval(prune, 1000 * 60 * 30).unref?.();

export function getSession(sessionId) {
  return store.get(sessionId);
}

export function ensureSession(sessionId, { restaurantId, slug }) {
  prune();
  let s = store.get(sessionId);
  if (!s) {
    s = {
      restaurantId,
      slug,
      messages: [],
      updatedAt: Date.now(),
    };
    store.set(sessionId, s);
  } else {
    s.updatedAt = Date.now();
  }
  return s;
}

export function appendMessage(sessionId, message) {
  const s = store.get(sessionId);
  if (!s) return null;
  s.messages.push(message);
  if (s.messages.length > MAX_MESSAGES) {
    s.messages = s.messages.slice(-MAX_MESSAGES);
  }
  s.updatedAt = Date.now();
  return s;
}

export function listMessages(sessionId) {
  const s = store.get(sessionId);
  return s ? [...s.messages] : [];
}
