import { Request, Response, NextFunction } from 'express';
import { ChallanService } from '../services/challanService';

export class ChallanController {
  static async createChallan(req: Request, res: Response, next: NextFunction) {
    try {
      const challan = await ChallanService.createChallan({
        ...req.body,
        user_id: req.user?.id,
      });

      res.status(201).json({
        status: 'success',
        message: `Sales Challan #${challan.challan_number} created successfully.`,
        data: challan,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getChallans(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, status, customer_id, page, limit } = req.query;
      const result = await ChallanService.getChallans({
        search: search as string,
        status: status as string,
        customer_id: customer_id as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.status(200).json({
        status: 'success',
        data: result.challans,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getChallanById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const challan = await ChallanService.getChallanById(id);
      res.status(200).json({
        status: 'success',
        data: challan,
      });
    } catch (error) {
      next(error);
    }
  }

  static async confirmChallan(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const challan = await ChallanService.confirmChallan(id, req.user?.id);
      res.status(200).json({
        status: 'success',
        message: `Sales Challan #${challan.challan_number} confirmed and stock updated.`,
        data: challan,
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancelChallan(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const challan = await ChallanService.cancelChallan(id);
      res.status(200).json({
        status: 'success',
        message: `Sales Challan #${challan.challan_number} cancelled.`,
        data: challan,
      });
    } catch (error) {
      next(error);
    }
  }
}
