import { OpenAPIRoute } from "chanfana";
import { z } from "zod";

export class GetToken extends OpenAPIRoute {
    schema = {
        request: {
            query: z.object({
                user_id: z.string().base64().length(64),
                application_id: z.string().base64().length(64),
            })
        }
    }
    async handle(c) {
        const data = await this.getValidatedData<typeof this.schema>()

        console.log(data);

        return await c.env.DB.prepare(
            "SELECT * FROM users WHERE user_id = ?1 AND application_id = ?2",
        ).bind([data.query.user_id, data.query.application_id]).run();
    }
}