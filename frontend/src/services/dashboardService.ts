import api from './api';
import type {
  DashboardSummary,
  DashboardLowStockProduct,
  DashboardActivityItem,
  DashboardSalesPoint,
  DashboardCustomerSummary,
} from '../types';

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  try {
    const response = await api.get('/dashboard/summary');
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      const fallback = await api.get('/dashboard/stats');
      return fallback.data;
    }
    throw error;
  }
};

export const getDashboardLowStock = async (): Promise<DashboardLowStockProduct[]> => {
  try {
    const response = await api.get('/dashboard/low-stock');
    return response.data;
  } catch {
    return [];
  }
};

export const getDashboardRecentActivity = async (): Promise<DashboardActivityItem[]> => {
  try {
    const response = await api.get('/dashboard/recent-activity');
    return response.data;
  } catch {
    return [];
  }
};

export const getDashboardSalesSummary = async (): Promise<DashboardSalesPoint[]> => {
  try {
    const response = await api.get('/dashboard/sales-summary');
    return response.data;
  } catch {
    return [];
  }
};

export const getDashboardCustomerSummary = async (): Promise<DashboardCustomerSummary> => {
  try {
    const response = await api.get('/dashboard/top-customers');
    return response.data;
  } catch {
    return { topCustomers: [], recentCustomers: [] };
  }
};
