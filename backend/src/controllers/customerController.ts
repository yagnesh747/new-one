import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customerService';

export class CustomerController {
  static async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, status, type, page, limit } = req.query;
      const result = await CustomerService.getCustomers({
        search: search as string,
        status: status as string,
        type: type as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.status(200).json({
        status: 'success',
        data: result.customers,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const customer = await CustomerService.getCustomerById(id);
      res.status(200).json({
        status: 'success',
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await CustomerService.createCustomer(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Customer created successfully.',
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const customer = await CustomerService.updateCustomer(id, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Customer updated successfully.',
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await CustomerService.deleteCustomer(id);
      res.status(200).json({
        status: 'success',
        message: 'Customer deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async addFollowUp(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { note, follow_up_date } = req.body;
      const followUp = await CustomerService.addFollowUp(
        id,
        note,
        follow_up_date,
        req.user?.id
      );

      res.status(201).json({
        status: 'success',
        message: 'Follow-up note recorded.',
        data: followUp,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getFollowUps(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const followUps = await CustomerService.getFollowUps(id);
      res.status(200).json({
        status: 'success',
        data: followUps,
      });
    } catch (error) {
      next(error);
    }
  }
}
