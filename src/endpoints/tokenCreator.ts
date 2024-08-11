import {OpenAPIRoute} from "chanfana";
import {z} from "zod";
import {worker_fetch} from "../util";
import {importJWK, SignJWT} from 'jose';

// OAuth2 Alternative "Authorisation Request indirectly via the authorisation
// server as an intermediary"

async function generate_signed_token(c, data: Record<string, unknown>) {
    const key = await importJWK(JSON.parse(c.env.SERVER_JWK)); // Import key from

    return await new SignJWT(
        data
    )
        .setProtectedHeader({alg: "ES256"})
        .setIssuedAt()
        .setExpirationTime(Date.now() + c.env.TOKEN_EXPIRY_TIME)
        .sign(key);
}

export class TokenCreator extends OpenAPIRoute {
    schema = {
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            username: z.string().max(32),
                            password: z.string().base64().length(88), // 512 bit password hash
                            application_id: z.string().base64().length(16),
                            permissions: z.array(z.string().max(24)).max(64) // Limit the size of the request
                        })
                    }
                }
            }
        }
    }

    async handle(c) {
        const data = await this.getValidatedData<typeof this.schema>();

        const {username, password, application_id, permissions} = data.body;

        const user_login = await worker_fetch("api/userLogin", JSON.stringify(
            {username: username, password: password}
        ), c.env.USER_AUTH);

        if (user_login.status != 200) {
            console.log(user_login);
            return new Response("User could not be logged in", {status: user_login.status});
        }
        const token = await generate_signed_token(c, {username, application_id, permissions})
        const expiry = Date.now() + c.env.TOKEN_EXPIRY_TIME * 1000

        const result = await c.env.DB.prepare(
            "INSERT INTO tokens(username, application_id, token, expiry) VALUES(?, ?, ?, ?)"
        ).bind(username, application_id, token, expiry).run();

        if (!result.success) {
            return new Response("Database Insertion Error", {status: 500});
        }

        return new Response(JSON.stringify({
            token: token
        }), {status: 200});
    }
}

