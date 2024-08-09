# quexeky-auth
An authentication service for my own websites. Learning how credential management systems,
OAuth, and other things work. Hosted on CloudFlare

# Installation
This installation assumes a pre-configured wrangler CLI. For more details, see 
[Cloudflare Docs](https://developers.cloudflare.com/workers/wrangler/install-and-update/) \
```git clone https://github.com/quexeky/quexeky-auth.git``` \
```cd quexeky-auth``` \
```npm i``` \
```npx wrangler d1 create quexeky-auth```
Take note of the "database_id" value provided
```toml
# wrangler.toml
name = "quexeky-auth"
main = "src/index.ts"
compatibility_date = "2024-07-25"
compatibility_flags = ["nodejs_compat"]

services = [
    { binding = "USER_AUTH", service = "cloudflare-user-db" },
    { binding = "USER_DATA", service = "cloudflare-user-data" }
]

[[d1_databases]]
binding = "DB"
database_name = "quexeky-auth"
database_id = "PASTE DATABASE_ID HERE"

[vars]
TOKEN_EXPIRY_TIME = 3600
```
```npx wrangler secrets put SERVER_JWK```
Paste in your JSON Web Key in here