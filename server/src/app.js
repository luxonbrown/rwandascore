import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { uploadDir } from './middleware/upload.js';
import { publicRouter } from './routes/public.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { managerRouter } from './routes/manager.routes.js';
import { serializeTeam } from './utils/serializers.js';

let teamInsertProbe;

async function probeTeamInsert() {
  try {
    await prisma.$transaction(async (tx) => {
      const stamp = Date.now();
      const created = await tx.team.create({
        data: {
          name: `Aperi FC Probe ${stamp}`,
          shortName: 'APR',
          initials: 'APR',
          slug: `aperi-fc-probe-${stamp}`,
          city: 'Kigali',
          stadiumId: null,
          founded: 1900,
          nickname: 'apr',
          coach: 'kamavinga',
          primaryColor: '#FF6B00',
          secondaryColor: '#121212',
          logoUrl: null,
          isNational: false,
          description: '',
        },
        include: { stadium: true },
      });
      serializeTeam(created);
      await tx.activityLog.create({
        data: {
          userId: null,
          action: 'probe',
          module: 'Health',
          recordType: 'team',
          recordId: created.id,
          description: 'Team insert health probe',
        },
      });
      throw new Error('__probe_rollback__');
    });
    return 'unexpected-commit';
  } catch (error) {
    if (error?.message === '__probe_rollback__') return 'ok';
    return {
      code: error?.code ?? null,
      name: error?.name ?? null,
      message: String(error?.message ?? '').slice(0, 300),
    };
  }
}

export function createApp() {
  const app = express();
  const allowedOrigins = env.FRONTEND_URL.split(',').map((item) => item.trim()).filter(Boolean);

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'If-Match'],
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use('/uploads', express.static(path.resolve(uploadDir), {
    fallthrough: false,
    maxAge: env.NODE_ENV === 'production' ? '7d' : 0,
    immutable: env.NODE_ENV === 'production',
  }));

  app.get('/health', async (req, res) => {
    const payload = {
      status: 'ok',
      service: 'rwandascore-api',
      commit: process.env.RENDER_GIT_COMMIT?.slice(0, 7) ?? null,
    };

    try {
      await prisma.$queryRaw`SELECT 1`;
      payload.database = 'ok';
    } catch (error) {
      payload.database = 'error';
      payload.databaseCode = error?.code ?? error?.name ?? null;
    }

    try {
      payload.activityLogCount = await prisma.activityLog.count();
    } catch (error) {
      payload.activityLogCount = null;
      payload.activityLogCode = error?.code ?? error?.name ?? null;
    }

    try {
      const [columns, triggers] = await Promise.all([
        prisma.$queryRaw`
          SELECT COLUMN_NAME AS columnName, COLUMN_TYPE AS columnType, IS_NULLABLE AS isNullable,
                 COLUMN_DEFAULT AS columnDefault, EXTRA AS extra
          FROM information_schema.columns
          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teams'
          ORDER BY ORDINAL_POSITION
        `,
        prisma.$queryRaw`
          SELECT TRIGGER_NAME AS triggerName, EVENT_MANIPULATION AS eventType, ACTION_TIMING AS timing
          FROM information_schema.triggers
          WHERE TRIGGER_SCHEMA = DATABASE() AND EVENT_OBJECT_TABLE = 'teams'
        `,
      ]);
      payload.teamSchema = columns;
      payload.teamTriggers = triggers;
      payload.activityLogSchema = await prisma.$queryRaw`
        SELECT COLUMN_NAME AS columnName, COLUMN_TYPE AS columnType, IS_NULLABLE AS isNullable,
               COLUMN_DEFAULT AS columnDefault, EXTRA AS extra
        FROM information_schema.columns
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_logs'
        ORDER BY ORDINAL_POSITION
      `;
    } catch (error) {
      payload.teamSchema = null;
      payload.teamSchemaCode = error?.code ?? error?.name ?? null;
    }

    teamInsertProbe ??= probeTeamInsert();
    payload.teamInsertProbe = await teamInsertProbe;
    payload.teamCount = await prisma.team.count();

    res.json(payload);
  });
  app.use('/api/v1', publicRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/manager', managerRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
