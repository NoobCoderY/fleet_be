import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export interface ValidationError {
  error: string;
  message: string;
  details: Array<{
    field: string;
    message: string;
  }>;
}


export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const validationError: ValidationError = {
        error: 'Validation failed',
        message: 'Request body contains invalid data',
        details: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      };

      res.status(400).json(validationError);
      return;
    }

    next();
  };
};


export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.query, { abortEarly: false });

    if (error) {
      const validationError: ValidationError = {
        error: 'Validation failed',
        message: 'Query parameters contain invalid data',
        details: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      };

      res.status(400).json(validationError);
      return;
    }

    next();
  };
};
