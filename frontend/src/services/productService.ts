import api from './api';
import type { Product, StockMovement } from '../types';

export const getProducts = async (params?: {
  search?: string;
  category?: string;
  lowStock?: boolean;
}): Promise<Product[]> => {
  const response = await api.get('/products', { params });
  return response.data;
};

export const getProductById = async (id: number): Promise<Product> => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const createProduct = async (data: Partial<Product>): Promise<Product> => {
  const response = await api.post('/products', data);
  return response.data;
};

export const updateProduct = async (id: number, data: Partial<Product>): Promise<Product> => {
  const response = await api.put(`/products/${id}`, data);
  return response.data;
};

export const getStockMovements = async (productId?: number): Promise<StockMovement[]> => {
  const response = await api.get('/products/stock-movements', {
    params: productId ? { productId } : {},
  });
  return response.data;
};

export const addStockMovement = async (data: {
  product_id: number;
  quantity: number;
  movement_type: 'IN' | 'OUT';
  reason: string;
}): Promise<StockMovement> => {
  const response = await api.post('/products/stock-movements', data);
  return response.data;
};
