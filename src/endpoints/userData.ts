import {OpenAPIRoute} from "chanfana";
import {z} from "zod";
import {importJWK, jwtVerify} from 'jose';
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

        const validated_token = await jwtVerify(token, key);
        console.log(validated_token);

        const result = await c.env.DB.prepare(
            "SELECT * FROM tokens WHERE token = ? AND username = ?",
        ).bind(token, username).run();

        if (!result.success) {
            return new Response(undefined, { status: 500 });
        }
        console.log("Result:", result.results);
        const exp = validated_token.payload.exp;
        if (typeof exp != "number") { return new Response(undefined, { status: 400 }); }

        if (exp < Date.now()) {
            await c.env.DB.prepare(
                "DELETE FROM tokens WHERE token = ? AND username = ?",
            ).bind(token, username).run();
            return new Response(undefined, { status: 401 })
        }
        console.log("User Result:", result.results[0]);
        const user_data = await worker_fetch("http://localhost:36685/api/getUserData", JSON.stringify(
            {
                key: "aaaaaaaa", user_id: "e3ba2d6a-f7ca-437c-b507-81fc9ad5a459", username: username, column: data
            }),
            c.env.USER_DATA
        );

        try {
            //const requested_data = result.results[0].permissions[data.query.data];
            console.log("Requested Data:", user_data);
            return new Response(user_data.text, { status: 200 });
        }
        catch {
            return new Response(undefined, { status: 404 })
        }

    }
}

