import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import {compareSync} from "bcrypt";

export class UserManager extends OpenAPIRoute {
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

        const recvPassword = Buffer.from(data.query.password, "base64");

        const user = await c.env.DB.prepare(
            "SELECT * FROM users WHERE username = ?1",
        ).bind(data.query.username).run();

        const password = user.password;

        console.log(user);

        const result = compareSync(recvPassword, password)

        console.log(result);

        return result;
    }
}

