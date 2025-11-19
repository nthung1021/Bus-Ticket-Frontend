export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    // Add other user fields as needed
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}
