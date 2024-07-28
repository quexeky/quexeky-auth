import { fromHono } from "chanfana";
import { Hono } from "hono";
import { TokenFinder } from "./endpoints/tokenFinder";

// Start a Hono app
const app = new Hono();

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/",
});

// Checking user data
openapi.get("/user", TokenFinder);

// Export the Hono app
export default app;
