export interface AccessTokenPayload {
  userId: string;
  username: string;
  email: string;
  roles: number[];
}

export interface RefreshTokenPayload {
  userId: string;
}
