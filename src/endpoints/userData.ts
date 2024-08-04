import {OpenAPIRoute} from "chanfana";
import {z} from "zod";
import {importJWK, jwtVerify} from 'jose';


export class UserData extends OpenAPIRoute {
    schema = {
        request: {
            query: z.object({
                username: z.string().max(32),
                token: z.string().regex(/^(?:[\w-]*\.){2}[\w-]*$/),
            })
        }
    }
    async handle(c) {
        const data = await this.getValidatedData<typeof this.schema>();

        const { crv, kty, x, y, alg } = JSON.parse(c.env.SERVER_JWK); // Jose automatically detects the "d" parameter, so we have to remove it
        const { username, token } = data.query;
        const key = await importJWK({crv, kty, x, y, alg}); // Import key from

        const validated_token = await jwtVerify(token, key);
        if (validated_token)
        console.log(validated_token);


        const result = await c.env.DB.prepare(
            "SELECT * FROM tokens WHERE token = ? AND username = ?",
        ).bind(token, username).run();

        if (!result.success) {
            return new Response(undefined, { status: 500 });
        }

        if (result.results[0].expiry < Date.now()) {
            await c.env.DB.prepare(
                "DELETE FROM tokens WHERE token = ? AND username = ?",
            ).bind(token, username).run();
            return new Response(undefined, { status: 401 })
        }

        return new Response(JSON.stringify({
            result
        }), { status: 200 });
    }
}

