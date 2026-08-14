const ACCESS_TOKEN_KEY = "admin_access_token";
const REFRESH_TOKEN_KEY = "admin_refresh_token";

export const getToken = (): string => localStorage.getItem(ACCESS_TOKEN_KEY) ?? "";
export const setToken = (token: string): void => localStorage.setItem(ACCESS_TOKEN_KEY, token);
export const removeToken = (): void => localStorage.removeItem(ACCESS_TOKEN_KEY);

export const getRefreshToken = (): string => localStorage.getItem(REFRESH_TOKEN_KEY) ?? "";
export const setRefreshToken = (token: string): void =>
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
export const removeRefreshToken = (): void => localStorage.removeItem(REFRESH_TOKEN_KEY);
