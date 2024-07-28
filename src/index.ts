import { fromHono } from "chanfana";
import { Hono } from "hono";
import { TokenFinder } from "./endpoints/tokenFinder";
import {UserManager} from "./endpoints/userManager";

// Start a Hono app
const app = new Hono();

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/",
});

// Checking user data
openapi.get("/user", UserManager);
openapi.get("/token", TokenFinder);

// Export the Hono app
export default app;
