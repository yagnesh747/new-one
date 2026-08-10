import { Request, Response, NextFunction } from 'express';
import { StockService } from '../services/stockService';

export class StockController {
  static async addStockMovement(req: Request, res: Response, next: NextFunction) {
    try {
      const { quantity_changed, movement_type, reason } = req.body;
      const product_id = req.params.id as string;

      const movement = await StockService.addStockMovement({
        product_id,
        quantity_changed,
        movement_type,
        reason,
        user_id: req.user?.id,
      });

      res.status(201).json({
        status: 'success',
        message: 'Stock adjustment saved successfully.',
        data: movement,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStockMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const { product_id, movement_type, page, limit } = req.query;
      const productIdParam = (req.params.id as string) || (product_id as string);

      const result = await StockService.getStockMovements({
        product_id: productIdParam,
        movement_type: movement_type as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.status(200).json({
        status: 'success',
        data: result.movements,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
}
