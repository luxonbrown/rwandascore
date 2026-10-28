import { verifyAccessToken } from '../utils/tokens.js';
import { unauthorized, forbidden } from '../utils/errors.js';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw unauthorized('Authentication required');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    const expired = error?.name === 'TokenExpiredError';
    throw unauthorized(expired ? 'Access token expired' : 'Invalid access token', 'INVALID_TOKEN');
  }

  if (payload?.type !== 'access' || !payload.sub) {
    throw unauthorized('Invalid access token', 'INVALID_TOKEN');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw unauthorized('Invalid access token', 'INVALID_TOKEN');
  if (!user.isActive) throw forbidden('This account has been disabled', 'ACCOUNT_DISABLED');

  req.user = user;
  next();
});

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(unauthorized('Authentication required'));
    if (!roles.includes(req.user.role)) {
      return next(forbidden('You do not have permission to perform this action'));
    }
    return next();
  };
}

export function requirePasswordChanged(req, res, next) {
  if (req.user?.mustChangePassword) {
    return next(
      forbidden(
        'You must change your temporary password before continuing',
        'PASSWORD_CHANGE_REQUIRED',
      ),
    );
  }
  return next();
}
