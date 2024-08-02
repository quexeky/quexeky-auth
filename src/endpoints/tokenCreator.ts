import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
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

        const user_login = await worker_fetch("userLogin", JSON.stringify(
            { username: data.query.username, password: data.query.password }
        ), c.env.USER_AUTH);
        console.log("User Login: ", user_login);

        const application_id = data.query.application_id;

        console.log(application_id);

        console.log("User:", data.query.username);

        const result = await c.env.DB.prepare(
            "INSERT INTO tokens(username, application_id) VALUES(?, ?)"
        ).bind(data.query.username, application_id).run();

        console.log(result);

        return result;
    }
}

