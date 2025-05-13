import { t } from "elysia";

export enum Gender {
  Man = 1000,
  Woman = 2000,
}

export const ProfileBodySchema = t.Object({
  about: t.Optional(t.String()),
  gender: t.Enum(Gender),
  age: t.Number({ minimum: 0 }),
  height: t.Number({ minimum: 0 }),
  weight: t.Number({ minimum: 0 }),
});
