import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import {worker_fetch} from "../util";
import {SignJWT, importPKCS8, importJWK} from 'jose';
import crypto from "node:crypto";

// OAuth2 Alternative "Authorisation Request indirectly via the authorisation
// server as an intermediary"

export class TokenCreator extends OpenAPIRoute {
    schema = {
        request: {
            query: z.object({
                username: z.string().max(32),
                password: z.string().base64().length(8), // 512 bit password hash
                application_id: z.string().base64().length(16),
                permissions: z.array(z.string())
            })
        }
    }
    async handle(c) {
        const data = await this.getValidatedData<typeof this.schema>();

        const { username, password, application_id } = data.query;

        const user_login = await worker_fetch("api/userLogin", JSON.stringify(
            { username: data.query.username, password: data.query.password }
        ), c.env.USER_AUTH);
        console.log("User Login: ", user_login);
        if (user_login.status != 200) {
            return new Response(undefined, {status: user_login.status});
        }

        const encoded_key = JSON.parse(c.env.SERVER_JWK);
        console.log(encoded_key)

        /*const token = new Uint8Array(64);
        crypto.getRandomValues(token);

        const encoded_token = btoa(String.fromCharCode(...token));
         */
        console.log("Generating Key");
        const key = await importJWK(encoded_key);
        console.log("Key:",key);


        const token = await new SignJWT(
            {
                username: data.query.username,
                application_id: application_id,
                permissions: data.query.permissions,
            }
        )
            .setProtectedHeader({ alg: "ES256" })
            .setIssuedAt()
            .setExpirationTime(c.env.TOKEN_EXPIRY_TIME)
            .sign(key);
        console.log(token);

        /*const token = await jwt.sign(
            {
                username: data.query.username,
                application_id: application_id,
                permissions: data.query.permissions,
            },
            c.env.JWT_SIGNATURE,
            { algorithm: "ES256" }
        )
         */

        console.log(application_id);

        console.log("User:", data.query.username);

        const result = await c.env.DB.prepare(
            "INSERT INTO tokens(username, application_id, token) VALUES(?, ?, ?)"
        ).bind(data.query.username, application_id, token).run();


        return new Response(JSON.stringify({
            token: token
        }), { status: 200 });
    }
}

