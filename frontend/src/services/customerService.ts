import api from './api';
import type { Customer, CustomerFollowup } from '../types';

export const getCustomers = async (params?: {
  search?: string;
  status?: string;
  type?: string;
}): Promise<Customer[]> => {
  const response = await api.get('/customers', { params });
  return response.data;
};

export const getCustomerById = async (id: number): Promise<Customer> => {
  const response = await api.get(`/customers/${id}`);
  return response.data;
};

export const createCustomer = async (data: Partial<Customer>): Promise<Customer> => {
  const response = await api.post('/customers', data);
  return response.data;
};

export const updateCustomer = async (id: number, data: Partial<Customer>): Promise<Customer> => {
  const response = await api.put(`/customers/${id}`, data);
  return response.data;
};

export const deleteCustomer = async (id: number): Promise<void> => {
  await api.delete(`/customers/${id}`);
};

export const getCustomerFollowups = async (customerId: number): Promise<CustomerFollowup[]> => {
  const response = await api.get(`/customers/${customerId}/followups`);
  return response.data;
};

export const addCustomerFollowup = async (customerId: number, note: string): Promise<CustomerFollowup> => {
  const response = await api.post(`/customers/${customerId}/followups`, { note });
  return response.data;
};
