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

        const { crv, kty, x, y, alg } = JSON.parse(c.env.SERVER_JWK); // Jose automatically detects the "d" parameter, so we have to remove it
        const { username, token } = data.query;
        const key = await importJWK({crv, kty, x, y, alg}); // Import key from


        const result = await c.env.DB.prepare(
            "SELECT * FROM tokens WHERE token = ? AND username = ?",
        ).bind(token, username).run();

        if (!result.success || result.results.length === 0) {
            return new Response(undefined, { status: 500 });
        }

        if (result.results[0].expiry < (Date.now())) {
            console.log("Expired");
            await c.env.DB.prepare(
                "DELETE FROM tokens WHERE token = ? AND username = ?",
            ).bind(token, username).run();
            return new Response("Expired Token", { status: 401 })
        }

        const { payload} = await jwtVerify(token, key);

        console.log(payload);
        if (!payload) { return new Response("Invalid Payload", { status: 401 }); }
        if (!payload.permissions.includes(data.query.data)) {return new Response(`Invalid permission `, { status: 401 })}

        console.log("Payload Permissions:", payload.permissions);
        console.log("User ID Auth Key:", c.env.APPLICATION_AUTH_KEY);
        const user_id = await worker_fetch("api/getUserID", JSON.stringify(
            {
                username: username,
                auth_key: c.env.USER_ID_AUTH_KEY
            }),
            c.env.USER_AUTH
        );
        console.log("User ID:", user_id);
        const user_data = await worker_fetch("api/getUserData", JSON.stringify(
            {
                key: c.env.USER_DATA_AUTH_KEY, user_id: user_id.text, column: data.query.data
            }),
            c.env.USER_DATA
        );

        try {
            //const requested_data = result.results[0].permissions[data.query.data];
            console.log("Requested Data:", user_data);
            return new Response(user_data.text, { status: user_data.status });
        }
        catch {
            return new Response(undefined, { status: 404 })
        }

    }
}

