import request from "./request";
import type { LoginPayload, LoginResult, TokenPair } from "@/types/auth";

export const login = (data: LoginPayload) => request.post<LoginResult>("/auth/login", data);

export const register = (data: LoginPayload) =>
  request.post<LoginResult>("/auth/register", data);

export const refreshTokens = (refreshToken: string) =>
  request.post<TokenPair>("/auth/refresh", { refreshToken });

export const logout = (refreshToken: string) =>
  request.post<null>("/auth/logout", { refreshToken });
