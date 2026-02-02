/**
 * Social OAuth providers supported by Supabase Auth.
 */
export type SocialProvider = "google" | "github" | "kakao" | "naver" | "apple";

/**
 * Auth request types for each flow.
 */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}




/**
 * Auth response data shapes.
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
  };
  tokens: AuthTokens;
}

/**
 * Union of all auth request types for generic handling.
 */
export type AuthRequest =
  | LoginRequest
  | RegisterRequest
  | ForgotPasswordRequest
  | ResetPasswordRequest;
