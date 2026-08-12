import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboardService';

export const getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await dashboardService.getDashboardSummary();
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};

export const getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const summary = await dashboardService.getDashboardSummary();
    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
};

export const getLowStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const products = await dashboardService.getLowStockProducts();
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

export const getRecentActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const activity = await dashboardService.getRecentActivity();
    res.status(200).json(activity);
  } catch (error) {
    next(error);
  }
};

export const getSalesSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const summary = await dashboardService.getSalesSummary();
    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
};

export const getTopCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const customers = await dashboardService.getTopCustomers();
    res.status(200).json(customers);
  } catch (error) {
    next(error);
  }
};
