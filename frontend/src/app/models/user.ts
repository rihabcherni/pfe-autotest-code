export interface LoginResponse {
  access_token: string;
}
export interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  profile_image: string;
  permissions?: string[];
}
export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  role: string;
}
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  role: 'admin' | 'tester';
  is_verified: boolean;
  profile_image?: string;
  verification_code?: string;
  reset_token?: string;
  reset_token_expiry?: Date;
  permissions?: string[];
}