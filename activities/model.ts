import { t } from "elysia";

export const ActivityIdParamsSchema = t.Object({
  activityId: t.String({
    pattern: "^[0-9a-fA-F]{24}$",
    error: "Invalid Activity ID format.",
  }),
});

export const UserIdParamsSchema = t.Object({
  userId: t.String({
    pattern: "^[0-9a-fA-F]{24}$",
    error: "Invalid User ID format.",
  }),
});

export const ActivityTypeEnum = t.Enum(
  {
    Running: "Running",
    Cycling: "Cycling",
    Swimming: "Swimming",
    WeightTraining: "Weight training",
    Walking: "Walking",
  },
  { error: "Invalid activity type." },
);

export const CreateActivityBaseSchema = t.Object({
  userId: t.String(),
  type: ActivityTypeEnum,
  duration: t.Numeric({
    minimum: 0,
    error: "Duration must be a positive number.",
  }),
  calories: t.Numeric({
    minimum: 0,
    error: "Calories must be a positive number.",
  }),
  distance: t.Optional(t.Numeric({ minimum: 0 })),
  description: t.Optional(t.String()),
  date: t.String({
    format: "date-time",
    error: "Invalid date format. Use ISO 8601.",
  }),
});

export const CreateActivityBodySchema = t.Intersect([
  CreateActivityBaseSchema,
  t.Object({
    img: t.File({
      maxSize: "5m",
      type: ["image/jpeg", "image/png", "image/webp"],
      error: "Invalid image file provided.",
    }),
  }),
]);

export const EditActivityBaseSchema = t.Partial(
  t.Object({
    activity_type: ActivityTypeEnum,
    duration: t.Numeric({ minimum: 0 }),
    calories: t.Numeric({ minimum: 0 }),
    distance: t.Optional(t.Numeric({ minimum: 0 })),
    description: t.Optional(t.String()),
    date: t.String({ format: "date-time" }),
  }),
);

export const EditActivityBodySchema = t.Intersect([
  EditActivityBaseSchema,
  t.Object({
    img: t.Optional(
      t.File({
        maxSize: "5m",
        type: ["image/jpeg", "image/png", "image/webp"],
        error: "Invalid image file provided for update.",
      }),
    ),
  }),
]);
