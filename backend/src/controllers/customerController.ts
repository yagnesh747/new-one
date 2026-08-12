import { Request, Response, NextFunction } from 'express';
import * as customerService from '../services/customerService';
import { customerSchema, followupSchema } from '../validators/customerValidator';

export const getCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const type = req.query.type as string | undefined;

    const customers = await customerService.getCustomers(search, status, type);
    res.status(200).json(customers);
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(paramId, 10);
    const customer = await customerService.getCustomerById(id);
    res.status(200).json(customer);
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = customerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.issues.map((e) => e.message),
      });
      return;
    }

    const customer = await customerService.createCustomer(parseResult.data);
    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(paramId, 10);
    const parseResult = customerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.issues.map((e) => e.message),
      });
      return;
    }

    const customer = await customerService.updateCustomer(id, parseResult.data);
    res.status(200).json(customer);
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(paramId, 10);
    await customerService.deleteCustomer(id);
    res.status(200).json({ message: 'Customer deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

export const getCustomerFollowups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(paramId, 10);
    const followups = await customerService.getCustomerFollowups(id);
    res.status(200).json(followups);
  } catch (error) {
    next(error);
  }
};

export const addCustomerFollowup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(paramId, 10);
    const parseResult = followupSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.issues.map((e) => e.message),
      });
      return;
    }

    const userId = req.user!.id;
    const followup = await customerService.addCustomerFollowup(id, parseResult.data.note, userId);
    res.status(201).json(followup);
  } catch (error) {
    next(error);
  }
};
