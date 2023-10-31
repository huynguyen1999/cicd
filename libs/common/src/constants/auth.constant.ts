export const SALT_ROUNDS = 10;

export const SESSION_COOKIE_NAME = 'session';

export const REFRESH_TOKEN_DURATION_MS = 60 * 60 * 24 * 30 * 1000; // 30 days in milliseconds

export const USER_ACTIVITY_INTERVAL_MS = 60000; // 30 seconds


export enum SessionStatus {
  Active = 'active',
  Revoked = 'revoked',
  Expired = 'expired',
}
export enum RefreshTokenStatus {
  Active = 'active',
  Expired = 'expired',
  Inactive = 'inactive',
}
