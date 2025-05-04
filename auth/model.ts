import { t } from "elysia";

export const LoginBodySchema = t.Object({
  email: t.String({ format: "email" }),
  password: t.String(),
});

export const RegisterBodySchema = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 8 }),
});

export interface AccessTokenPayload {
  userId: string;
  roles: number[];
}

export interface RefreshTokenPayload {
  userId: string;
}
