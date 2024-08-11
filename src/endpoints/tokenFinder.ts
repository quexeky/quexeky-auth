import {OpenAPIRoute} from "chanfana";
import {z} from "zod";

// Client "Authorisation Grant" via the token which the server is notified.
// The authorisation token should only work once before being deleted.
// If different data is required, then the token must be regenerated

export class TokenFinder extends OpenAPIRoute {
    schema = {
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            token: z.string(),
                            application_id: z.string().base64().length(32),
                        })
                    }
                },
            }
        }
    }

    async handle(c) {
        const data = await this.getValidatedData<typeof this.schema>()

        const result = await c.env.DB.prepare(
            "SELECT * FROM tokens WHERE token = ? AND application_id = ?",
        ).bind(data.body.token, data.body.application_id).run();

        await c.env.DB.prepare(
            "DELETE FROM tokens WHERE token = ? AND application_id = ?",
        ).bind(data.body.token)

        return new Response();
    }
}