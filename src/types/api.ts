export interface ResponseMeta {
  timestamp: number;
  requestId: string;
}

/** 后端统一成功响应：{ code: 0, data, meta } */
export interface UnifiedResponse<T = unknown> {
  code: number;
  message?: string;
  data: T;
  meta: ResponseMeta;
}

export interface ApiError {
  code: number;
  message: string;
}
