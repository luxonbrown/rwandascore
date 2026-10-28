import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/errors.js';
import { isTest } from '../config/env.js';

export function notFoundHandler(req, res, next) {
  next(new ApiError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof ApiError) {
    return res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: {
          code: 'DUPLICATE',
          message: 'A record with these values already exists',
          details: { fields: error.meta?.target ?? [] },
        },
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Resource not found' },
      });
    }

    if (error.code === 'P2003') {
      return res.status(409).json({
        error: {
          code: 'CONFLICT',
          message: 'This record is referenced by other records and cannot be changed or deleted',
        },
      });
    }
  }

  if (error?.name === 'MulterError') {
    return res.status(400).json({
      error: {
        code: 'INVALID_FILE_TYPE',
        message:
          error.code === 'LIMIT_FILE_SIZE'
            ? 'The uploaded file is too large'
            : 'The uploaded file could not be accepted',
      },
    });
  }

  if (!isTest) {
    console.error(error);
  }

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
