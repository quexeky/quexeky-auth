import { OpenAPIRoute } from "chanfana";
import { z } from "zod";

// Client "Authorisation Grant" via the token which the server is notified.
// The authorisation token should only work once before being deleted.
// If different data is required, then the token must be regenerated

export class TokenFinder extends OpenAPIRoute {
    schema = {
        request: {
            query: z.object({
                token: z.string(),
                application_id: z.string().base64().length(16),
            })
        }
    }
    async handle(c) {
        const data = await this.getValidatedData<typeof this.schema>()

        console.log(data);

        const result = await c.env.DB.prepare(
            "SELECT * FROM tokens WHERE token = ? AND application_id = ?",
        ).bind(data.query.token, data.query.application_id).run();
        await c.env.DB.prepare(
            "DELETE FROM tokens WHERE token = ? AND application_id = ?",
        ).bind(data.query.token)
        return result.results;
    }
}