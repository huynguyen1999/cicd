export const REDIS_OPTIONS = 'REDIS_OPTIONS';

// should I create a redis key factory here?
// rooms that user joined
export const USER_CONNECTED_ROOMS = (userId: string) =>
  `connected_rooms_of:${userId}`;
export const USER_CONNECTED_SOCKETS = (userId: string) =>
  `connected_sockets_of:${userId}`;
export const USER_SESSIONS = (sessionId: string) => `sessions:${sessionId}`;
export const USER_DATA = (userId: string) => `user_data:${userId}`;

export const EXPIRE_USER_SESSION_QUEUE = 'expire_user_session';
