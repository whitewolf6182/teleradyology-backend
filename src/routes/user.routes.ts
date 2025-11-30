import { Elysia, t } from 'elysia';
import { UserService } from '../services/user.service';
import { authMiddleware } from '../middleware/auth.middleware';

const userService = new UserService();

export const userRoutes = new Elysia({ prefix: '/users' })
  .use(authMiddleware)
  .get(
    '/profile',
    async ({ user, error }) => {
      if (!user) {
        return error(401, { message: 'Unauthorized' });
      }

      try {
        const profile = await userService.getProfile(user.userId);
        return {
          success: true,
          data: profile,
        };
      } catch (err: any) {
        return error(500, {
          success: false,
          message: err.message,
        });
      }
    },
    {
      isAuthenticated: true,
    }
  )
  .put(
    '/profile',
    async ({ user, body, error }) => {
      if (!user) {
        return error(401, { message: 'Unauthorized' });
      }

      try {
        const updatedProfile = await userService.updateProfile(user.userId, body);
        return {
          success: true,
          message: 'Profile updated successfully',
          data: updatedProfile,
        };
      } catch (err: any) {
        return error(500, {
          success: false,
          message: err.message,
        });
      }
    },
    {
      isAuthenticated: true,
      body: t.Object({
        first_name: t.Optional(t.String()),
        last_name: t.Optional(t.String()),
        email: t.Optional(t.String({ format: 'email' })),
        phone: t.Optional(t.String()),
        company_id: t.Optional(t.String()),
        license_number: t.Optional(t.String()),
        specialization: t.Optional(t.String()),
        hospital_name: t.Optional(t.String()),
        department: t.Optional(t.String()),
        profile_image_url: t.Optional(t.String()),
      }),
    }
  )
  .get(
    '/',
    async ({ user, error }) => {
      if (!user) {
        return error(401, { message: 'Unauthorized' });
      }

      if (user.role !== 'admin') {
        return error(403, { message: 'Forbidden' });
      }

      try {
        const users = await userService.getAllUsers();
        return {
          success: true,
          data: users,
        };
      } catch (err: any) {
        return error(500, {
          success: false,
          message: err.message,
        });
      }
    },
    {
      hasRole: ['admin'],
    }
  )
  .get(
    '/company/:companyId',
    async ({ user, params, error }) => {
      if (!user) {
        return error(401, { message: 'Unauthorized' });
      }

      if (user.role !== 'admin') {
        return error(403, { message: 'Forbidden' });
      }

      try {
        const users = await userService.getCompanyUsers(params.companyId);
        return {
          success: true,
          data: users,
        };
      } catch (err: any) {
        return error(500, {
          success: false,
          message: err.message,
        });
      }
    },
    {
      hasRole: ['admin'],
      params: t.Object({
        companyId: t.String(),
      }),
    }
  );
