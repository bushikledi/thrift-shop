import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AsyncLocalStorage } from 'async_hooks';

// Async local storage for request context
export const asyncLocalStorage = new AsyncLocalStorage<Map<string, string>>();

// Helper to get correlation ID from anywhere
export function getCorrelationId(): string {
  const store = asyncLocalStorage.getStore();
  return store?.get('correlationId') || 'unknown';
}

// Helper to get user ID from context
export function getContextUserId(): string | undefined {
  const store = asyncLocalStorage.getStore();
  return store?.get('userId');
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId =
      (req.headers['x-correlation-id'] as string) || uuidv4();

    const store = new Map<string, string>();
    store.set('correlationId', correlationId);

    // Add user ID if authenticated
    const authReq = req as AuthenticatedRequest;
    if (authReq.user?.id) {
      store.set('userId', authReq.user.id);
    }

    // Set correlation ID in response header
    res.setHeader('x-correlation-id', correlationId);

    asyncLocalStorage.run(store, () => next());
  }
}
