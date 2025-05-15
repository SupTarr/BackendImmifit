import { AccessTokenPayload } from "../auth/model.js";

export const verifyJWT = async ({ jwtAccess, set, request, error }: any) => {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return error(400)
  }

  const token = authHeader.split(" ")[1].trim();
  const payload = (await jwtAccess.verify(token)) as AccessTokenPayload | false;
  console.log("payload:", payload);
  if (!payload) {
    return error(400)
  } 

  return { userId: payload.userId };
};
