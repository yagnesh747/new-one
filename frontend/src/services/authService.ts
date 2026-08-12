import api from './api';
import type { User } from '../types';

export const login = async (email: string, password: string): Promise<{ token: string; user: User }> => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (data: {
  name: string;
  email: string;
  password: string;
  role: string;
}): Promise<{ token: string; user: User }> => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const getMe = async (): Promise<User> => {
  const response = await api.get('/auth/me');
  return response.data;
};
