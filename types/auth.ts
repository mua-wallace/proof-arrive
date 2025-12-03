/**
 * Authentication types for ProofArrive
 */

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  username?: string;
  email?: string;
  company?: string;
  accid?: string;
  subid?: string;
  token?: string;
  msg?: {
    item?: string;
  };
  message?: string;
  success?: boolean;
}

export interface AuthVerificationResponse {
  success: boolean;
  valid: boolean;
}

export interface ProofArriveUser {
  loginUsername: string;
  fullName: string;
  email: string;
  company: string;
  accid: string;
  subid: string;
  token: string;
}







