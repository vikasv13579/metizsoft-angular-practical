export interface AuthUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  image?: string;
}

export interface LoginResponse extends AuthUser {
  accessToken: string;
  refreshToken: string;
}
