import { OpenAPIRoute } from "chanfana";
import { z } from "zod";

export class TokenFinder extends OpenAPIRoute {
    schema = {
        request: {
            query: z.object({
                token: z.string().base64().length(16),
                application_id: z.string().base64().length(16),
            })
        }
    }
    async handle(c) {
        const data = await this.getValidatedData<typeof this.schema>()

        console.log(data);

        const result = await c.env.DB.prepare(
            "SELECT * FROM tokens WHERE token_id = ? AND application_id = ?",
        ).bind(data.query.token, data.query.application_id).run();
        return result.results;
    }
}