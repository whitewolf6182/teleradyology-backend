import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';

export const authMiddleware = new Elysia()
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET || 'your-secret-key',
      exp: '15m',
    })
  )
  .use(
    jwt({
      name: 'refreshJwt',
      secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      exp: '7d',
    })
  )
  .derive(async ({ headers, jwt }) => {
    const auth = headers.authorization;

    if (!auth || !auth.startsWith('Bearer ')) {
      return { user: null };
    }

    const token = auth.slice(7);
    const payload = await jwt.verify(token);

    if (!payload) {
      return { user: null };
    }

    return {
      user: {
        userId: payload.userId as string,
        username: payload.username as string,
        role: payload.role as string,
      },
    };
  })
  .macro(({ onBeforeHandle }) => ({
    isAuthenticated(enabled: boolean) {
      if (!enabled) return;

      onBeforeHandle(({ user, error }) => {
        if (!user) {
          return error(401, { message: 'Unauthorized' });
        }
      });
    },
    hasRole(roles: string[]) {
      onBeforeHandle(({ user, error }) => {
        if (!user) {
          return error(401, { message: 'Unauthorized' });
        }

        if (!roles.includes(user.role)) {
          return error(403, { message: 'Forbidden' });
        }
      });
    },
  }));
