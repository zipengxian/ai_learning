import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { ApiResponse } from '../types';

/** API 客户端配置 */
const DEFAULT_CONFIG: AxiosRequestConfig = {
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

/** 创建 axios 实例 */
export const createApiClient = (config?: AxiosRequestConfig): AxiosInstance => {
  const instance = axios.create({ ...DEFAULT_CONFIG, ...config });

  // 请求拦截器
  instance.interceptors.request.use(
    (reqConfig) => {
      const token = localStorage.getItem('token');
      if (token && reqConfig.headers) {
        reqConfig.headers.Authorization = `Bearer ${token}`;
      }
      return reqConfig;
    },
    (error) => Promise.reject(error),
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    },
  );

  return instance;
};

/** 默认 API 客户端实例 */
export const apiClient = createApiClient();

export default apiClient;