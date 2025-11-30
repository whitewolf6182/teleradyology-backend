import { Elysia, t } from 'elysia';
import { AuthService } from '../services/auth.service';
import { authMiddleware } from '../middleware/auth.middleware';

// Constants
const TOKEN_EXPIRY = {
  ACCESS: '15m',
  REFRESH: '7d'
} as const;

const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_CREDENTIALS: 'Invalid credentials',
  INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token',
  REGISTRATION_FAILED: 'User registration failed',
  LOGOUT_FAILED: 'Logout failed',
  TOKEN_REFRESH_FAILED: 'Token refresh failed'
} as const;

// Response helpers
const createSuccessResponse = (message: string, data?: any) => ({
  success: true,
  message,
  ...(data && { data })
});

const createErrorResponse = (message: string, details?: any) => ({
  success: false,
  message,
  ...(details && { details })
});

// Validation schemas
const registerSchema = t.Object({
  username: t.String({ minLength: 3, maxLength: 50 }),
  password: t.String({ minLength: 6 }),
  first_name: t.String({ minLength: 1, maxLength: 100 }),
  last_name: t.String({ minLength: 1, maxLength: 100 }),
  email: t.String({ format: 'email' }),
  phone: t.Optional(t.String({ maxLength: 20 })),
  company_id: t.Optional(t.String()),
  role: t.Optional(t.Union([
    t.Literal('admin'),
    t.Literal('radiologist'),
    t.Literal('technician'),
    t.Literal('user'),
  ])),
  license_number: t.Optional(t.String({ maxLength: 50 })),
  specialization: t.Optional(t.String({ maxLength: 100 })),
  hospital_name: t.Optional(t.String({ maxLength: 200 })),
  department: t.Optional(t.String({ maxLength: 100 })),
});

const loginSchema = t.Object({
  username: t.String(),
  password: t.String(),
});

const refreshTokenSchema = t.Object({
  refreshToken: t.String(),
});

export const setupAuthRoutes = (authService: AuthService) => {
  return new Elysia({ prefix: '/auth' })
    .use(authMiddleware)
    
    // Health check
    .get('/health', () => createSuccessResponse('Auth service is healthy'))
    
    // Register
    .post(
      '/register',
      async ({ body, set }) => {
        try {
          const result = await authService.register(body);
          
          set.status = 201;
          return createSuccessResponse('User registered successfully', {
            username: result.login.username,
            email: result.user.email,
            role: result.login.role,
            userId: result.user.id,
          });
        } catch (error: any) {
          set.status = 400;
          
          // Log the error for monitoring
          console.error('Registration error:', error);
          
          return createErrorResponse(
            ERROR_MESSAGES.REGISTRATION_FAILED,
            process.env.NODE_ENV === 'development' ? error.message : undefined
          );
        }
      },
      {
        body: registerSchema,
        detail: {
          tags: ['Auth'],
          summary: 'Register new user',
          description: 'Create a new user account with the provided details'
        }
      }
    )
    
    // Login
    .post(
      '/login',
      async ({ body, jwt, set, cookie: { refreshToken } }) => {
        try {
          const result = await authService.login(body);

          const accessToken = await jwt.sign({
            userId: result.userId,
            username: result.username,
            role: result.role,
          });

          const newRefreshToken = await jwt.sign(
            {
              userId: result.userId,
              username: result.username,
              role: result.role,
            },
            { expiresIn: TOKEN_EXPIRY.REFRESH }
          );

          // Store refresh token in database
          await authService.updateRefreshToken(result.userId, newRefreshToken);

          // Set HTTP-only cookie for refresh token
          refreshToken.value = newRefreshToken;
          refreshToken.httpOnly = true;
          refreshToken.secure = process.env.NODE_ENV === 'production';
          refreshToken.sameSite = 'strict';
          refreshToken.maxAge = 7 * 24 * 60 * 60; // 7 days

          set.status = 200;
          return createSuccessResponse('Login successful', {
            accessToken,
            user: {
              userId: result.userId,
              username: result.username,
              role: result.role,
              profile: result.user,
            },
          });
        } catch (error: any) {
          set.status = 401;
          console.error('Login error:', error);
          
          return createErrorResponse(ERROR_MESSAGES.INVALID_CREDENTIALS);
        }
      },
      {
        body: loginSchema,
        detail: {
          tags: ['Auth'],
          summary: 'User login',
          description: 'Authenticate user and return access token'
        }
      }
    )
    
    // Refresh Token
    .post(
      '/refresh',
      async ({ body, jwt, set }) => {
        try {
          const { refreshToken } = body;

          if (!refreshToken) {
            set.status = 401;
            return createErrorResponse('Refresh token is required');
          }

          // Verify refresh token
          const payload = await jwt.verify(refreshToken);
          if (!payload?.userId) {
            set.status = 401;
            return createErrorResponse(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
          }

          // Verify user exists and token matches
          const user = await authService.verifyRefreshToken(payload.userId as string, refreshToken);
          if (!user) {
            set.status = 401;
            return createErrorResponse(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
          }

          // Generate new access token
          const accessToken = await jwt.sign({
            userId: user.userId,
            username: user.username,
            role: user.role,
          });

          set.status = 200;
          return createSuccessResponse('Token refreshed successfully', {
            accessToken,
          });
        } catch (error: any) {
          set.status = 401;
          console.error('Token refresh error:', error);
          
          return createErrorResponse(ERROR_MESSAGES.TOKEN_REFRESH_FAILED);
        }
      },
      {
        body: refreshTokenSchema,
        isAuthenticated: false,
        detail: {
          tags: ['Auth'],
          summary: 'Refresh access token',
          description: 'Get new access token using refresh token'
        }
      }
    )
    
    // Logout
    .post(
      '/logout',
      async ({ user, set, cookie: { refreshToken } }) => {
        if (!user) {
          set.status = 401;
          return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED);
        }

        try {
          // Clear refresh token from database
          await authService.updateRefreshToken(user.userId, null);
          
          // Clear refresh token cookie
          refreshToken.remove();

          set.status = 200;
          return createSuccessResponse('Logged out successfully');
        } catch (error: any) {
          set.status = 500;
          console.error('Logout error:', error);
          
          return createErrorResponse(ERROR_MESSAGES.LOGOUT_FAILED);
        }
      },
      {
        isAuthenticated: true,
        detail: {
          tags: ['Auth'],
          summary: 'User logout',
          description: 'Logout user and clear refresh token'
        }
      }
    )
    
    // Get Current User
    .get(
      '/me',
      async ({ user, set }) => {
        if (!user) {
          set.status = 401;
          return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED);
        }

        try {
          const userData = await authService.getUserProfile(user.userId);
          
          set.status = 200;
          return createSuccessResponse('User profile retrieved successfully', userData);
        } catch (error: any) {
          set.status = 404;
          console.error('Get user profile error:', error);
          
          return createErrorResponse('User not found');
        }
      },
      {
        isAuthenticated: true,
        detail: {
          tags: ['Auth'],
          summary: 'Get current user profile',
          description: 'Retrieve authenticated user profile information'
        }
      }
    );
};

// Export initialized routes
export const authRoutes = setupAuthRoutes(new AuthService());