import { Elysia } from "elysia";
import { AccessTokenPayload } from "../auth/model.js";
import { jwtAccessSetup } from "../jwt/utils.js";

export const verifyJwt = new Elysia()
  .use(jwtAccessSetup)
  .state("userId", "")
  .onRequest(async ({ jwtAccess, request, set, store }) => {
    if (request.method === "OPTIONS") {
      return;
    }

    const url = new URL(request.url);
    const requestPath = url.pathname;
    const publicAuthPaths = [
      "/auth/login",
      "/auth/register",
      "/auth/refresh",
      "/auth/logout",
    ];

    if (
      publicAuthPaths.some((publicPath) => requestPath.startsWith(publicPath))
    ) {
      return;
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      set.status = 401;
      return {
        status: "INVALID_TOKEN",
        message: "Missing or invalid authorization header",
      };
    }

    const token = authHeader.split(" ")[1].trim();
    const payload = (await jwtAccess.verify(token)) as
      | AccessTokenPayload
      | false;

    if (!payload) {
      set.status = 401;
      return {
        status: "INVALID_TOKEN",
        message: "Invalid or expired token",
      };
    }

    if (payload.roles && !payload.roles.includes(1000)) {
      set.status = 403;
      return {
        status: "INVALID_TOKEN",
        message: "Insufficient permissions",
      };
    }

    store.userId = payload.userId;
  });
