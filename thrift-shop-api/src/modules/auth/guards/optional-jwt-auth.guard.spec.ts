import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

/**
 * F6: checkout supports both guest and authenticated users. This guard must
 * attach req.user when a token is present but never reject when it is absent.
 */
describe('OptionalJwtAuthGuard', () => {
  let guard: OptionalJwtAuthGuard;

  beforeEach(() => {
    guard = new OptionalJwtAuthGuard();
  });

  describe('handleRequest', () => {
    it('returns the user when authentication succeeded', () => {
      const user = { id: 'u1' };
      expect(guard.handleRequest(null, user)).toBe(user);
    });

    it('returns undefined (not throw) when there is no user', () => {
      expect(guard.handleRequest(null, false)).toBeUndefined();
    });

    it('returns undefined even when passport reports an error', () => {
      expect(
        guard.handleRequest(new Error('no token'), false),
      ).toBeUndefined();
    });
  });

  describe('canActivate', () => {
    const ctx = {} as ExecutionContext;

    it('allows the request when the jwt strategy succeeds', async () => {
      jest
        .spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockResolvedValueOnce(true);
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });

    it('still allows the request when the jwt strategy rejects (guest)', async () => {
      jest
        .spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockRejectedValueOnce(new Error('Unauthorized'));
      await expect(guard.canActivate(ctx)).resolves.toBe(true);
    });
  });
});
