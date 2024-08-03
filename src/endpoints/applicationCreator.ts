import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import {compareSync, hashSync} from "bcryptjs";

export class UserOnboarding extends OpenAPIRoute {
    schema = {
        request: {
            query: z.object({
                key: z.string().base64().length(8), // 512 bit password hash
            })
        }
    }
    async handle(c) {
        const data = await this.getValidatedData<typeof this.schema>();

        const recvKey = data.query.key;


        const password = hashSync(recvKey);
        console.log("Password:", password);

        const application_id = new Uint8Array(64);
        crypto.getRandomValues(application_id);
        


        const result = await c.env.DB.prepare(
            "INSERT INTO users(username, password) VALUES(?1, ?2)"
        ).bind(data.query.username, password).run();

        console.log(result);

        return result;
    }
}

