import {OpenAPIRoute} from "chanfana";
import {z} from "zod";
import {decodeJwt, importJWK, jwtVerify} from 'jose';
import {worker_fetch} from "../util";


export class UserData extends OpenAPIRoute {
    schema = {
        request: {
            query: z.object({
                username: z.string().max(32),
                token: z.string().regex(/^(?:[\w-]*\.){2}[\w-]*$/),
                data: z.string()
            })
        }
    }

    async handle(c) {
        const data = await this.getValidatedData<typeof this.schema>();

        // Jose automatically detects the "d" secret key parameter, so we have to remove it
        const {crv, kty, x, y, alg} = JSON.parse(c.env.SERVER_JWK);
        const {username, token} = data.query;

        // Import key from the serverside JWK
        const key = await importJWK({crv, kty, x, y, alg});

        const result = await c.env.DB.prepare(
            "SELECT * FROM tokens WHERE token = ? AND username = ?",
        ).bind(token, username).run();

        if (!result.success) {
            return new Response("Database selection error", {status: 500});
        }
        if (result.results.length === 0) {
            return new Response("Token could not be found")
        }

        // Check expiry in database
        if (result.results[0].expiry < (Date.now())) {
            console.log("Deleting expired token");
            await c.env.DB.prepare(
                "DELETE FROM tokens WHERE token = ? AND username = ?",
            ).bind(token, username).run();
            return new Response("Expired Token", {status: 401})
        }

        // Validate that the token is valid and get the payload data which contains the actual data required
        const {payload} = await jwtVerify(token, key);

        if (!payload) {
            return new Response("Invalid Payload", {status: 401});
        }
        // Ensure that the token has the required permissions to access the specific data
        if (!payload.permissions.includes(data.query.data)) {
            return new Response(`Invalid permission `, {status: 401})
        }

        const user_id = await worker_fetch("api/getUserID", JSON.stringify(
                {
                    username: username,
                    auth_key: c.env.USER_ID_AUTH_KEY
                }),
            c.env.USER_AUTH
        );
        const user_data = await worker_fetch("api/getUserData", JSON.stringify(
                {
                    key: c.env.USER_DATA_AUTH_KEY, user_id: user_id.text, column: data.query.data
                }),
            c.env.USER_DATA
        );
        return new Response(user_data.text, {status: user_data.status});
    }
}

