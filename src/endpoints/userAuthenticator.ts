import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import {compareSync, hashSync} from "bcryptjs";

export class UserAuthenticator extends OpenAPIRoute {
    schema = {
        request: {
            query: z.object({
                username: z.string().max(32),
                password: z.string().base64().length(8), // 512 bit password hash
            })
        }
    }
    async handle(c) {
        const data = await this.getValidatedData<typeof this.schema>();

        const recvPassword = data.query.password;

        console.log("RecvPassword:", recvPassword);

        const user = await c.env.DB.prepare(
            "SELECT * FROM users WHERE username = ?1",
        ).bind(data.query.username).run();

        console.log(hashSync(recvPassword));

        const password = user.results[0].password;
        console.log("Password:", password);

        console.log("User:", user);

        const result = compareSync(recvPassword, password)

        console.log(result);
        if (result) {
            return new Response(undefined, {status: 200});
        }
        return new Response(undefined, {status: 401});

    }
}

