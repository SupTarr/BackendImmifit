// Assuming src/index.ts exports the app instance for testing
// e.g., export const app = new Elysia()...; (without .listen())
// This is a common pattern for testability.
// For now, we will use a local instance as in the original instruction.

import { Elysia } from "elysia"; // Assuming Elysia can be used this way for testing requests

// If direct import of the app from src/index.ts is not feasible yet,
// create a minimal Elysia instance for this initial test.
const testApp = new Elysia().get("/", () => ({ status: "SUCCESS" }));

describe("GET / endpoint", () => {
  it("should return 200 and a success message", async () => {
    // Elysia's .handle() method is used to simulate requests
    const request = new Request("http://localhost/");
    const response = await testApp.handle(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: "SUCCESS" });
  });
});
