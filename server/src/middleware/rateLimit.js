import rateLimit from 'express-rate-limit';
import { isTest } from '../config/env.js';

const common = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => isTest,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later',
    },
  },
};

export const apiLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 300,
});

export const loginLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 5,
});
