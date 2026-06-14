import apiClient from './client';
import type { User, ApiResponse } from '@k12/shared';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
  grade?: number;
  subjects?: import('@k12/shared').Subject[];
}

export interface AuthResult {
  token: string;
  user: User;
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const response = await apiClient.post<ApiResponse<AuthResult>>('/auth/login', {
    email,
    password,
  });
  return response.data.data;
}

export async function register(data: RegisterData): Promise<AuthResult> {
  const response = await apiClient.post<ApiResponse<AuthResult>>('/auth/register', data);
  return response.data.data;
}

export async function getMe(): Promise<User> {
  const response = await apiClient.get<ApiResponse<User>>('/auth/me');
  return response.data.data;
}

export async function updateProfile(data: Partial<RegisterData>): Promise<User> {
  const response = await apiClient.put<ApiResponse<User>>('/auth/profile', data);
  return response.data.data;
}