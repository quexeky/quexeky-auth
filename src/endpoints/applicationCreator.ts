import { OpenAPIRoute } from "chanfana";
import { z } from "zod";

export class ApplicationCreator extends OpenAPIRoute {
    schema = {
        request: {
            query: z.object({
                key: z.string().base64().length(32), // Authorisation key to create new applications
            })
        }
    }
    async handle(c) {
        const data = await this.getValidatedData<typeof this.schema>();

        if (data.query.key !== c.env.APPLICATION_AUTH_KEY) {
            return new Response(undefined, {status: 401});
        }


        const application_id = crypto.randomUUID();


        const result = await c.env.DB.prepare(
            "INSERT INTO applications(application_id) VALUES(?)"
        ).bind(application_id).run();

        return new Response(JSON.stringify({application_id: application_id}), {status: 200});
    }
}

