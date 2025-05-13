import { t, Context, type Cookie as ElysiaCookie } from "elysia";

export interface JwtUtility<PayloadType = Record<string, any>> {
  sign: (payload: PayloadType) => Promise<string> | string;
  verify: (
    token: string,
  ) => Promise<PayloadType | false> | (PayloadType | false);
}

export interface AppCookieStore {
  jwt: ElysiaCookie<string | undefined>;
}

export interface AuthContext extends Context {
  access: JwtUtility<AccessTokenPayload>;
  refresh: JwtUtility<RefreshTokenPayload>;
  cookie: AppCookieStore & Record<string, ElysiaCookie<string | undefined>>;
}

export const LoginBodySchema = t.Object({
  email: t.String({ format: "email" }),
  password: t.String(),
});

export const RegisterBodySchema = t.Object({
  email: t.String({ format: "email" }),
  username: t.String({ minLength: 3 }),
  password: t.String({ minLength: 8 }),
});

export interface AccessTokenPayload {
  userId: string;
  roles: number[];
}

export interface RefreshTokenPayload {
  userId: string;
}
