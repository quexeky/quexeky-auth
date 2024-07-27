import { fromHono } from "chanfana";
import { Hono } from "hono";
import { RequestUser } from "./endpoints/requestUser";

// Start a Hono app
const app = new Hono();

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/",
});

// Checking user data
openapi.get("/user", RequestUser);

// Export the Hono app
export default app;
