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
        .setExpirationTime(c.env.TOKEN_EXPIRY_TIME)
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
                            password: z.string().base64().length(8), // 512 bit password hash
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
        console.log("Data parsed");

        const { username, password, application_id, permissions } = data.body;

        const user_login = await worker_fetch("api/userLogin", JSON.stringify(
            { username: username, password: password }
        ), c.env.USER_AUTH);

        if (user_login.status != 200) {
            return new Response(undefined, {status: user_login.status});
        }
        const token = await generate_signed_token(c, { username, application_id, permissions });

        const result = await c.env.DB.prepare(
            "INSERT INTO tokens(username, application_id, token, expiry) VALUES(?, ?, ?, ?)"
        ).bind(username, application_id, token, Date.now() + 60 * 60 * 24 * 30 /* 30 days before expiry */).run();

        if (!result.success) {
            return new Response(undefined, { status: 500 });
        }

        return new Response(JSON.stringify({
            token: token
        }), { status: 200 });
    }
}

