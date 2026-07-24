import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT auth: runs the jwt strategy so that `req.user` is populated when
 * a valid token/cookie is present, but never rejects the request when it is
 * absent or invalid. Use for routes that support both authenticated and guest
 * access (e.g. checkout) — unlike `@Public()`, which skips the guard entirely
 * and so never attaches the user.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Always run the strategy to attach the user if possible, but swallow the
    // "no/invalid token" rejection so guests are still allowed through.
    try {
      await super.canActivate(context);
    } catch {
      // ignore — request continues as a guest
    }
    return true;
  }

  // Return the user when present, undefined otherwise. Never throw.
  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return user || (undefined as unknown as TUser);
  }
}
