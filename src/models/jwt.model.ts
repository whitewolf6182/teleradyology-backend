export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      userId: string;
      username: string;
      role: string;
      profile: any;
    };
  };
}
