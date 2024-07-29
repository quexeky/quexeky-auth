import { fromHono } from "chanfana";
import { Hono } from "hono";
import { TokenFinder } from "./endpoints/tokenFinder";
import {UserAuthenticator} from "./endpoints/userAuthenticator";
import {UserOnboarding} from "./endpoints/userOnboarding";

// Start a Hono app
const app = new Hono();

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/",
});

// Checking user data
openapi.get("/user", UserAuthenticator);
openapi.get("/token", TokenFinder);
openapi.post("/user", UserOnboarding)

// Export the Hono app
export default app;
