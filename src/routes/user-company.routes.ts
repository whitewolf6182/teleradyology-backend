import { Elysia, t } from 'elysia';
import { UserCompanyService } from '../services/user-company.service';
import { authMiddleware } from '../middleware/auth.middleware';

const userCompanyService = new UserCompanyService();

export const userCompanyRoutes = new Elysia({ prefix: '/user-companies' })
  .use(authMiddleware)
  .post(
    '/',
    async ({ user, body, error }) => {
      if (!user) {
        return error(401, { message: 'Unauthorized' });
      }

      if (user.role !== 'admin') {
        return error(403, { message: 'Forbidden' });
      }

      try {
        const relationship = await userCompanyService.addUserToCompany(body);
        return {
          success: true,
          message: 'User added to company successfully',
          data: relationship,
        };
      } catch (err: any) {
        return error(400, {
          success: false,
          message: err.message,
        });
      }
    },
    {
      hasRole: ['admin'],
      body: t.Object({
        user_id: t.String(),
        company_id: t.String(),
        role_in_company: t.Optional(t.String()),
        department: t.Optional(t.String()),
        start_date: t.Optional(t.String()),
      }),
    }
  )
  .get(
    '/user/:userId',
    async ({ user, params, error }) => {
      if (!user) {
        return error(401, { message: 'Unauthorized' });
      }

      if (user.role !== 'admin' && user.userId !== params.userId) {
        return error(403, { message: 'Forbidden' });
      }

      try {
        const companies = await userCompanyService.getUserCompanies(params.userId);
        return {
          success: true,
          data: companies,
        };
      } catch (err: any) {
        return error(404, {
          success: false,
          message: err.message,
        });
      }
    },
    {
      isAuthenticated: true,
      params: t.Object({
        userId: t.String(),
      }),
    }
  )
  .get(
    '/user/:userId/active',
    async ({ user, params, error }) => {
      if (!user) {
        return error(401, { message: 'Unauthorized' });
      }

      if (user.role !== 'admin' && user.userId !== params.userId) {
        return error(403, { message: 'Forbidden' });
      }

      try {
        const companies = await userCompanyService.getActiveUserCompanies(params.userId);
        return {
          success: true,
          data: companies,
        };
      } catch (err: any) {
        return error(404, {
          success: false,
          message: err.message,
        });
      }
    },
    {
      isAuthenticated: true,
      params: t.Object({
        userId: t.String(),
      }),
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
        const users = await userCompanyService.getCompanyUsers(params.companyId);
        return {
          success: true,
          data: users,
        };
      } catch (err: any) {
        return error(404, {
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
  )
  .get(
    '/company/:companyId/active',
    async ({ user, params, error }) => {
      if (!user) {
        return error(401, { message: 'Unauthorized' });
      }

      if (user.role !== 'admin') {
        return error(403, { message: 'Forbidden' });
      }

      try {
        const users = await userCompanyService.getActiveCompanyUsers(params.companyId);
        return {
          success: true,
          data: users,
        };
      } catch (err: any) {
        return error(404, {
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
  )
  .get(
    '/company/:companyId/managers',
    async ({ user, params, error }) => {
      if (!user) {
        return error(401, { message: 'Unauthorized' });
      }

      if (user.role !== 'admin') {
        return error(403, { message: 'Forbidden' });
      }

      try {
        const managers = await userCompanyService.getCompanyManagers(params.companyId);
        return {
          success: true,
          data: managers,
        };
      } catch (err: any) {
        return error(404, {
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
  )
  .put(
    '/:relationshipId',
    async ({ user, params, body, error }) => {
      if (!user) {
        return error(401, { message: 'Unauthorized' });
      }

      if (user.role !== 'admin') {
        return error(403, { message: 'Forbidden' });
      }

      try {
        const updated = await userCompanyService.updateUserCompanyRole(
          params.relationshipId,
          body
        );
        return {
          success: true,
          message: 'User-Company relationship updated successfully',
          data: updated,
        };
      } catch (err: any) {
        return error(400, {
          success: false,
          message: err.message,
        });
      }
    },
    {
      hasRole: ['admin'],
      params: t.Object({
        relationshipId: t.String(),
      }),
      body: t.Object({
        role_in_company: t.Optional(t.String()),
        department: t.Optional(t.String()),
        is_active: t.Optional(t.Boolean()),
        end_date: t.Optional(t.String()),
      }),
    }
  )
  .post(
    '/:relationshipId/deactivate',
    async ({ user, params, error }) => {
      if (!user) {
        return error(401, { message: 'Unauthorized' });
      }

      if (user.role !== 'admin') {
        return error(403, { message: 'Forbidden' });
      }

      try {
        const updated = await userCompanyService.deactivateUserInCompany(params.relationshipId);
        return {
          success: true,
          message: 'User deactivated in company',
          data: updated,
        };
      } catch (err: any) {
        return error(400, {
          success: false,
          message: err.message,
        });
      }
    },
    {
      hasRole: ['admin'],
      params: t.Object({
        relationshipId: t.String(),
      }),
    }
  )
  .post(
    '/:relationshipId/activate',
    async ({ user, params, error }) => {
      if (!user) {
        return error(401, { message: 'Unauthorized' });
      }

      if (user.role !== 'admin') {
        return error(403, { message: 'Forbidden' });
      }

      try {
        const updated = await userCompanyService.activateUserInCompany(params.relationshipId);
        return {
          success: true,
          message: 'User activated in company',
          data: updated,
        };
      } catch (err: any) {
        return error(400, {
          success: false,
          message: err.message,
        });
      }
    },
    {
      hasRole: ['admin'],
      params: t.Object({
        relationshipId: t.String(),
      }),
    }
  )
  .delete(
    '/:relationshipId',
    async ({ user, params, error }) => {
      if (!user) {
        return error(401, { message: 'Unauthorized' });
      }

      if (user.role !== 'admin') {
        return error(403, { message: 'Forbidden' });
      }

      try {
        await userCompanyService.removeUserFromCompany(params.relationshipId);
        return {
          success: true,
          message: 'User removed from company successfully',
        };
      } catch (err: any) {
        return error(400, {
          success: false,
          message: err.message,
        });
      }
    },
    {
      hasRole: ['admin'],
      params: t.Object({
        relationshipId: t.String(),
      }),
    }
  )
  .get(
    '/user/:userId/with-details',
    async ({ user, params, error }) => {
      if (!user) {
        return error(401, { message: 'Unauthorized' });
      }

      if (user.role !== 'admin' && user.userId !== params.userId) {
        return error(403, { message: 'Forbidden' });
      }

      try {
        const data = await userCompanyService.getUserWithCompanies(params.userId);
        return {
          success: true,
          data,
        };
      } catch (err: any) {
        return error(404, {
          success: false,
          message: err.message,
        });
      }
    },
    {
      isAuthenticated: true,
      params: t.Object({
        userId: t.String(),
      }),
    }
  )
  .get(
    '/company/:companyId/with-details',
    async ({ user, params, error }) => {
      if (!user) {
        return error(401, { message: 'Unauthorized' });
      }

      if (user.role !== 'admin') {
        return error(403, { message: 'Forbidden' });
      }

      try {
        const data = await userCompanyService.getCompanyWithUsers(params.companyId);
        return {
          success: true,
          data,
        };
      } catch (err: any) {
        return error(404, {
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
