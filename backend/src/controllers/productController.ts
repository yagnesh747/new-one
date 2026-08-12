import { Request, Response, NextFunction } from 'express';
import * as productService from '../services/productService';
import { productSchema, stockMovementSchema } from '../validators/productValidator';

export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const lowStock = req.query.lowStock === 'true';

    const products = await productService.getProducts(search, category, lowStock);
    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(paramId, 10);
    const product = await productService.getProductById(id);
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = productSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.issues.map((e) => e.message),
      });
      return;
    }

    const product = await productService.createProduct(parseResult.data);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(paramId, 10);
    const parseResult = productSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.issues.map((e) => e.message),
      });
      return;
    }

    const product = await productService.updateProduct(id, parseResult.data);
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

export const getStockMovements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const prodIdQuery = req.query.productId ? (Array.isArray(req.query.productId) ? req.query.productId[0] : req.query.productId) : undefined;
    const productId = prodIdQuery ? parseInt(prodIdQuery as string, 10) : undefined;
    const movements = await productService.getStockMovements(productId);
    res.status(200).json(movements);
  } catch (error) {
    next(error);
  }
};

export const addStockMovement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = stockMovementSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.issues.map((e) => e.message),
      });
      return;
    }

    const userId = req.user!.id;
    const { product_id, quantity, movement_type, reason } = parseResult.data;

    const movement = await productService.addManualStockMovement(product_id, quantity, movement_type, reason, userId);
    res.status(201).json(movement);
  } catch (error) {
    next(error);
  }
};
