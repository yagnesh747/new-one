import { Request, Response, NextFunction } from 'express';
import * as challanService from '../services/challanService';
import { createChallanSchema, updateChallanSchema } from '../validators/challanValidator';

export const getChallans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;

    const challans = await challanService.getChallans(search, status);
    res.status(200).json(challans);
  } catch (error) {
    next(error);
  }
};

export const getChallanById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(paramId, 10);
    const challan = await challanService.getChallanById(id);
    res.status(200).json(challan);
  } catch (error) {
    next(error);
  }
};

export const createChallan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = createChallanSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.issues.map((e) => e.message),
      });
      return;
    }

    const userId = req.user!.id;
    const challan = await challanService.createChallan(parseResult.data, userId);
    res.status(201).json(challan);
  } catch (error) {
    next(error);
  }
};

export const updateDraftChallan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(paramId, 10);
    const parseResult = updateChallanSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.issues.map((e) => e.message),
      });
      return;
    }

    const challan = await challanService.updateDraftChallan(id, parseResult.data);
    res.status(200).json(challan);
  } catch (error) {
    next(error);
  }
};

export const confirmChallan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(paramId, 10);
    const userId = req.user!.id;
    const challan = await challanService.confirmChallan(id, userId);
    res.status(200).json(challan);
  } catch (error) {
    next(error);
  }
};

export const cancelChallan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(paramId, 10);
    const challan = await challanService.cancelChallan(id);
    res.status(200).json(challan);
  } catch (error) {
    next(error);
  }
};
