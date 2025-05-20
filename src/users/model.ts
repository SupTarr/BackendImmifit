import { t } from "elysia";

export enum Gender {
  Man = 1000,
  Woman = 2000,
}

export const ProfileBodySchema = t.Object({
  imageId: t.Optional(t.String()),
  file: t.Optional(t.File({ format: "image/*" })),
  about: t.Optional(t.String()),
  gender: t.Numeric(Gender),
  age: t.Numeric({ minimum: 0 }),
  height: t.Numeric({ minimum: 0 }),
  weight: t.Numeric({ minimum: 0 }),
});
