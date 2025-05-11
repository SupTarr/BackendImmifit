import app from "../src/index.js";
export const config = { runtime: "edge" };
export default async function handler(request) {
    return app.fetch(request);
}
