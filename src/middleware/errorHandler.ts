import { Request, Response, NextFunction } from 'express';

export interface ErrorResponse {
  error: string;
  message: string;
  stack?: string;
}


export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);


  let status = 500;
  let error = 'Internal Server Error';
  let message = 'An unexpected error occurred';


  if (err.name === 'ValidationError') {
    status = 400;
    error = 'Validation Error';
    message = err.message;
  } else if (err.name === 'CastError') {
    status = 400;
    error = 'Invalid ID';
    message = 'Invalid resource ID format';
  } else if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    status = 400;
    error = 'Duplicate Entry';
    message = 'Resource already exists';
  } else if (err.message) {
    message = err.message;
  }

  const errorResponse: ErrorResponse = {
    error,
    message,
  };


  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(status).json(errorResponse);
};


export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
};
