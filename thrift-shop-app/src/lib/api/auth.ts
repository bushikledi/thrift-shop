/**
 * Authentication API Service
 */
import { get, post } from "../apiClient";
import type {
  SignupDto,
  AuthResponseDto,
  LogoutResponseDto,
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
  ResetPasswordDto,
  ResetPasswordResponseDto,
  ChangePasswordDto,
  ChangePasswordResponseDto,
  MeResponseDto,
  RefreshTokenResponseDto,
} from "@/types";

export interface LoginDto {
  email: string;
  password: string;
}

export const authApi = {
  /**
   * Register a new user (customer or vendor)
   */
  signup: (data: SignupDto): Promise<AuthResponseDto> =>
    post<AuthResponseDto, SignupDto>("/auth/signup", data),

  /**
   * Login with email and password
   */
  login: (data: LoginDto): Promise<AuthResponseDto> =>
    post<AuthResponseDto, LoginDto>("/auth/login", data),

  /**
   * Logout and clear session
   */
  logout: (): Promise<LogoutResponseDto> =>
    post<LogoutResponseDto>("/auth/logout"),

  /**
   * Request password reset email
   */
  forgotPassword: (
    data: ForgotPasswordDto
  ): Promise<ForgotPasswordResponseDto> =>
    post<ForgotPasswordResponseDto, ForgotPasswordDto>(
      "/auth/forgot-password",
      data
    ),

  /**
   * Reset password with token
   */
  resetPassword: (data: ResetPasswordDto): Promise<ResetPasswordResponseDto> =>
    post<ResetPasswordResponseDto, ResetPasswordDto>(
      "/auth/reset-password",
      data
    ),

  /**
   * Change password (authenticated)
   */
  changePassword: (
    data: ChangePasswordDto
  ): Promise<ChangePasswordResponseDto> =>
    post<ChangePasswordResponseDto, ChangePasswordDto>(
      "/auth/change-password",
      data
    ),

  /**
   * Get current authenticated user
   */
  me: (): Promise<MeResponseDto> => get<MeResponseDto>("/auth/me"),

  /**
   * Refresh access token
   */
  refresh: (): Promise<RefreshTokenResponseDto> =>
    post<RefreshTokenResponseDto>("/auth/refresh"),
};

export default authApi;
