export const REDIS_OPTIONS = 'REDIS_OPTIONS';

// rooms that user joined
export const USER_JOINED_ROOMS = (userId: string) => `joined_rooms_of:${userId}`;
