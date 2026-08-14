import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { ElMessage } from "element-plus";

import {
  getToken,
  getRefreshToken,
  setToken,
  setRefreshToken,
  removeToken,
  removeRefreshToken,
} from "@/utils/auth";
import type { UnifiedResponse } from "@/types/api";

interface ExtendedConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

const service: AxiosInstance = axios.create({ baseURL, timeout: 15000 });

// 请求拦截：注入 Bearer token
service.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

let isRefreshing = false;
const waiters: Array<(token: string) => void> = [];

function forceLogout() {
  removeToken();
  removeRefreshToken();
  if (location.pathname !== "/login") {
    location.href = "/login";
  }
}

/** 用 refresh token 换新的 access token（裸 axios，避免递归进拦截器） */
async function refreshAccessToken(): Promise<string> {
  const res = await axios.post<
    UnifiedResponse<{ accessToken: string; refreshToken: string }>
  >(`${baseURL}/auth/refresh`, { refreshToken: getRefreshToken() });
  const body = res.data;
  if (body.code !== 0 || !body.data?.accessToken) {
    throw new Error("refresh failed");
  }
  setToken(body.data.accessToken);
  setRefreshToken(body.data.refreshToken);
  const token = body.data.accessToken;
  // 唤醒在刷新期间排队的请求
  waiters.splice(0).forEach((cb) => cb(token));
  return token;
}

// 响应拦截：解包 { code, data, meta }；处理 401 自动刷新与业务错误
service.interceptors.response.use(
  (response) => {
    const body = response.data as UnifiedResponse | undefined;
    // 非 envelope（理论上不会出现，兜底）
    if (!body || typeof body !== "object" || typeof body.code !== "number") {
      return response.data;
    }
    if (body.code === 0) return body.data;
    const message = body.message || "请求失败";
    ElMessage.error(message);
    return Promise.reject({ code: body.code, message });
  },
  async (error) => {
    const { response, config } = error;
    const cfg = config as ExtendedConfig | undefined;

    // 401 → 尝试用 refresh 换新 token 后重试一次
    if (response?.status === 401 && cfg && !cfg._retried && getRefreshToken()) {
      if (isRefreshing) {
        // 正在刷新：排队等新 token
        return new Promise((resolve, reject) => {
          waiters.push((token) => {
            cfg._retried = true;
            cfg.headers.set("Authorization", `Bearer ${token}`);
            service.request(cfg).then(resolve).catch(reject);
          });
        });
      }
      isRefreshing = true;
      try {
        const token = await refreshAccessToken();
        cfg._retried = true;
        cfg.headers.set("Authorization", `Bearer ${token}`);
        return service.request(cfg);
      } catch {
        forceLogout();
        return Promise.reject({ code: 401, message: "登录已过期，请重新登录" });
      } finally {
        isRefreshing = false;
      }
    }

    const message = response?.data?.message || error.message || "网络错误";
    ElMessage.error(message);
    return Promise.reject({ code: response?.data?.code ?? -1, message });
  },
);

/**
 * 封装后的请求工具：响应拦截器已把 {code,data} 解包为 data，
 * 因此这里的泛型 T 直接是「业务数据」的类型。
 */
const request = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    service.get(url, config) as unknown as Promise<T>,
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    service.post(url, data, config) as unknown as Promise<T>,
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    service.put(url, data, config) as unknown as Promise<T>,
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    service.patch(url, data, config) as unknown as Promise<T>,
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    service.delete(url, config) as unknown as Promise<T>,
};

export default request;
