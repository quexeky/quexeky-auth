# quexeky-auth
An authentication service for my own websites. Learning how credential management systems,
OAuth, and other things work. Hosted on CloudFlare

# Setup
This setup assumes a pre-configured wrangler CLI, although includes the package itself within the dependencies. For more details, see 
[Cloudflare Docs](https://developers.cloudflare.com/workers/wrangler/install-and-update/) \
```git clone https://github.com/quexeky/quexeky-auth.git``` \
```cd quexeky-auth``` \
```npm i``` \
```npx wrangler d1 create quexeky-auth```
Take note of the "database_id" value provided and replace <DATABASE_ID> with that value
```toml
# wrangler.toml

# ...

[[d1_databases]]
binding = "DB"
database_name = "quexeky-auth"
database_id = "<PASTE DATABASE_ID HERE>"

# ...
```
Replace <INTEGER_VALUE> to whatever token expiry time is desired (in seconds). Default is set to 3600
```toml
# wrangler.toml

# ...

[vars]
TOKEN_EXPIRY_TIME = <INTEGER_VALUE>
```
```npx wrangler secrets put SERVER_JWK```
Paste in your generated EC JSON Web Key in here. 
[Details](https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-key-sets) \ \
Copy your "USER_ID_AUTH_KEY" and "USER_DATA_AUTH_KEY" from the "cloudflare-user-db" and "cloudflare-user-data" services respectively
```npx wrangler secrets put USER_ID_AUTH_KEY``` \
```npx wrangler secrets put USER_DATA_AUTH_KEY```

# Deploy
```npx wrangler deploy```