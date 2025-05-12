import app from "../src/index.js";
export default async function handler(request) {
    return app.fetch(request);
}
