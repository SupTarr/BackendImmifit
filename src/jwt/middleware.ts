import { AccessTokenPayload } from "../auth/model.js";

export const verifyJWT = async ({ jwtAccess, set, request }: any) => {
  const authHeader = request.headers.get("authorization");
  console.log("authHeader:", authHeader);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    set.status = 400;
    return {
      status: "INVALID_REQUEST",
      message: "Missing or invalid authorization header",
    };
  }

  const token = authHeader.split(" ")[1].trim();
  const payload = (await jwtAccess.verify(token)) as AccessTokenPayload | false;
  if (!payload) {
    set.status = 400;
    return {
      status: "INVALID_REQUEST",
      message: "Invalid or expired token",
    };
  }

  return { payload };
};
