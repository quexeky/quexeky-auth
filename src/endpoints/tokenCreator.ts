import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import {compareSync, hashSync} from "bcryptjs";
import {worker_fetch} from "../util";

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

        const user_login = worker_fetch("/userLogin", JSON.stringify(
            { username: data.query.username, password: data.query.password }
        ), c.env.USER_AUTH);

        const recvPassword = data.query.password;

        const password = hashSync(recvPassword);
        console.log("Password:", password);

        console.log("User:", data.query.username);

        const result = await c.env.DB.prepare(
            "INSERT INTO tokens(username, password) VALUES(?1, ?2)"
        ).bind(data.query.username, password).run();

        console.log(result);

        return result;
    }
}

