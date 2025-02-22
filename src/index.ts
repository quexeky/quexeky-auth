import {fromHono} from "chanfana";
import {Hono} from "hono";
import {TokenFinder} from "./endpoints/tokenFinder";
import {TokenCreator} from "./endpoints/tokenCreator";
import {ApplicationCreator} from "./endpoints/applicationCreator";
import {UserData} from "./endpoints/userData";

// Start a Hono app
const app = new Hono();

// Setup OpenAPI registry
const openapi = fromHono(app, {
    docs_url: "/",
});

// Checking user data
// openapi.get("/token", TokenFinder);
openapi.post("/token", TokenCreator);
openapi.post("/createApplication", ApplicationCreator);
openapi.get("/userData", UserData);

// Export the Hono app
export default app;
