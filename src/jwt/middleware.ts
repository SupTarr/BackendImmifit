import { Elysia } from "elysia";
import { AccessTokenPayload } from "../auth/model.js";
import { jwtAccessSetup } from "../jwt/utils.js";

export const verifyJwt = new Elysia({})
  .use(jwtAccessSetup)
  .derive({ as: "scoped" }, async ({ jwtAccess, request, set }) => {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      set.status = 400;
      throw new Error("Invalid or expired token");
    }

    const token = authHeader.split(" ")[1].trim();
    const payload = (await jwtAccess.verify(token)) as
      | AccessTokenPayload
      | false;

    if (!payload) {
      set.status = 400;
      throw new Error("Invalid or expired token");
    }

    if (payload.roles && !payload.roles.includes(1000)) {
      set.status = 400;
      throw new Error("Invalid or expired token");
    }

    return { userId: payload.userId };
  });
