import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService';

export class ProductController {
  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, category, lowStock, page, limit } = req.query;
      const result = await ProductService.getProducts({
        search: search as string,
        category: category as string,
        lowStock: lowStock === 'true',
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.status(200).json({
        status: 'success',
        data: result.products,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const product = await ProductService.getProductById(id);
      res.status(200).json({
        status: 'success',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.createProduct(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Product created successfully.',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const product = await ProductService.updateProduct(id, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Product updated successfully.',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }
}
