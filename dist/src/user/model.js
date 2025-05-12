import { t } from "elysia";
export var Gender;
(function (Gender) {
    Gender[Gender["Man"] = 1000] = "Man";
    Gender[Gender["Woman"] = 2000] = "Woman";
})(Gender || (Gender = {}));
export const UserIdParamsSchema = t.Object({
    userId: t.String({
        pattern: "^[0-9a-fA-F]{24}$",
        error: "Invalid User ID format. Must be a 24-character hex string.",
    }),
});
export const ProfileBodySchema = t.Object({
    about: t.Optional(t.String()),
    gender: t.Enum(Gender),
    age: t.Optional(t.Number({ minimum: 0 })),
    height: t.Optional(t.Number({ minimum: 0 })),
    weight: t.Optional(t.Number({ minimum: 0 })),
});
