import api from './api';
import type { Challan } from '../types';

export const getChallans = async (params?: {
  search?: string;
  status?: string;
}): Promise<Challan[]> => {
  const response = await api.get('/challans', { params });
  return response.data;
};

export const getChallanById = async (id: number): Promise<Challan> => {
  const response = await api.get(`/challans/${id}`);
  return response.data;
};

export const createChallan = async (data: {
  customer_id: number;
  status: 'Draft' | 'Confirmed';
  items: { product_id: number; quantity: number }[];
}): Promise<Challan> => {
  const response = await api.post('/challans', data);
  return response.data;
};

export const updateDraftChallan = async (
  id: number,
  data: {
    customer_id: number;
    items: { product_id: number; quantity: number }[];
  }
): Promise<Challan> => {
  const response = await api.put(`/challans/${id}`, data);
  return response.data;
};

export const confirmChallan = async (id: number): Promise<Challan> => {
  const response = await api.patch(`/challans/${id}/confirm`);
  return response.data;
};

export const cancelChallan = async (id: number): Promise<Challan> => {
  const response = await api.patch(`/challans/${id}/cancel`);
  return response.data;
};
