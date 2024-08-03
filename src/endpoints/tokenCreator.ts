import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import {worker_fetch} from "../util";

// OAuth2 Alternative "Authorisation Request indirectly via the authorisation
// server as an intermediary"

export class TokenCreator extends OpenAPIRoute {
    schema = {
        request: {
            query: z.object({
                username: z.string().max(32),
                password: z.string().base64().length(8), // 512 bit password hash
                application_id: z.string().base64().length(16)
            })
        }
    }
    async handle(c) {
        const data = await this.getValidatedData<typeof this.schema>();

        const user_login = await worker_fetch("api/userLogin", JSON.stringify(
            { username: data.query.username, password: data.query.password }
        ), c.env.USER_AUTH);
        console.log("User Login: ", user_login);
        if (user_login.status != 200) {
            return new Response(undefined, {status: user_login.status});
        }

        const application_id = data.query.application_id;

        const token = new Uint8Array(64);
        crypto.getRandomValues(token);

        const encoded_token = btoa(String.fromCharCode(...token));

        console.log(application_id);

        console.log("User:", data.query.username);

        const result = await c.env.DB.prepare(
            "INSERT INTO tokens(username, application_id, token) VALUES(?, ?, ?)"
        ).bind(data.query.username, application_id, encoded_token).run();


        return new Response(JSON.stringify({
            token: encoded_token
        }), { status: 200 });
    }
}

