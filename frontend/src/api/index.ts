import api from './client';
import {
  User,
  Customer,
  CustomerFollowUp,
  Product,
  StockMovement,
  Challan,
  DashboardStats,
  ApiResponse,
} from '../types';

export const authApi = {
  login: (email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; full_name: string; role?: string }): Promise<ApiResponse<{ token: string; user: User }>> =>
    api.post('/auth/register', data),
  getMe: (): Promise<ApiResponse<User>> => api.get('/auth/me'),
  getUsers: (): Promise<ApiResponse<User[]>> => api.get('/auth/users'),
};

export const customerApi = {
  getCustomers: (params?: {
    search?: string;
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Customer[]>> => api.get('/customers', { params }),

  getCustomerById: (id: string): Promise<ApiResponse<Customer>> => api.get(`/customers/${id}`),

  createCustomer: (data: Partial<Customer>): Promise<ApiResponse<Customer>> =>
    api.post('/customers', data),

  updateCustomer: (id: string, data: Partial<Customer>): Promise<ApiResponse<Customer>> =>
    api.put(`/customers/${id}`, data),

  deleteCustomer: (id: string): Promise<ApiResponse<void>> => api.delete(`/customers/${id}`),

  addFollowUp: (
    customerId: string,
    data: { note: string; follow_up_date?: string }
  ): Promise<ApiResponse<CustomerFollowUp>> =>
    api.post(`/customers/${customerId}/followups`, data),

  getFollowUps: (customerId: string): Promise<ApiResponse<CustomerFollowUp[]>> =>
    api.get(`/customers/${customerId}/followups`),
};

export const productApi = {
  getProducts: (params?: {
    search?: string;
    category?: string;
    lowStock?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Product[]>> => api.get('/products', { params }),

  getProductById: (id: string): Promise<ApiResponse<Product>> => api.get(`/products/${id}`),

  createProduct: (data: Partial<Product>): Promise<ApiResponse<Product>> =>
    api.post('/products', data),

  updateProduct: (id: string, data: Partial<Product>): Promise<ApiResponse<Product>> =>
    api.put(`/products/${id}`, data),

  addStockMovement: (
    productId: string,
    data: { quantity_changed: number; movement_type: 'IN' | 'OUT'; reason: string }
  ): Promise<ApiResponse<StockMovement>> =>
    api.post(`/products/${productId}/stock-movement`, data),

  getStockMovements: (
    productId: string,
    params?: { movement_type?: string; page?: number; limit?: number }
  ): Promise<ApiResponse<StockMovement[]>> =>
    api.get(`/products/${productId}/stock-movements`, { params }),
};

export const stockApi = {
  getAllStockMovements: (params?: {
    product_id?: string;
    movement_type?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<StockMovement[]>> => api.get('/stock-movements', { params }),
};

export const challanApi = {
  getChallans: (params?: {
    search?: string;
    status?: string;
    customer_id?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Challan[]>> => api.get('/challans', { params }),

  getChallanById: (id: string): Promise<ApiResponse<Challan>> => api.get(`/challans/${id}`),

  createChallan: (data: {
    customer_id: string;
    notes?: string;
    items: { product_id: string; quantity: number }[];
    confirm_immediately?: boolean;
  }): Promise<ApiResponse<Challan>> => api.post('/challans', data),

  confirmChallan: (id: string): Promise<ApiResponse<Challan>> => api.post(`/challans/${id}/confirm`),

  cancelChallan: (id: string): Promise<ApiResponse<Challan>> => api.post(`/challans/${id}/cancel`),
};

export const dashboardApi = {
  getStats: (): Promise<ApiResponse<DashboardStats>> => api.get('/dashboard/stats'),
};
