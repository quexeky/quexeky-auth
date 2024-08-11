# quexeky-auth
An authentication service for my own websites. Learning how credential management systems,
OAuth, and other things work. Hosted on CloudFlare and can be viewed at [auth.quexeky.dev](https://auth.quexeky.dev).

Sample user logins:
username: quex \
password: stringstringstringstringstringstringstringstringstringstringstringstringstringstringst== \
\
For validating: 
location: Paris \
age: 18 

This repository assumes a pre-existing setup of [Cloudflare User Data](https://github.com/quexeky/cloudflare-user-data) and
[Cloudflare User DB](https://github.com/quexeky/cloudflare-user-db) in that order. See those pages
for setup. 

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

This value may also be put into the `.dev.vars` file for local deployment by replacing keys with their respective generated values:
```dotenv
# .dev.vars
SERVER_JWK="<SERVER_JWK>"
USER_DATA_AUTH_KEY="<USER_DATA_AUTH_KEY>"
USER_ID_AUTH_KEY="<USER_ID_AUTH_KEY>"
```

# Deploy
```npx wrangler deploy```

# Usage
1. Go to https://YOUR.WORKER.URL/
2. Expand the "|POST| /token" form
3. Copy the "username" and "password" fields from a created user from the cloudflare-user-db service
4. Request for either "age", "location", or both ("age", "location") permissions within the "permissions" array
5. Execute the query
6. Copy the provided token into the "|GET| /userData" "token" field.
7. Copy the same username into the "username" field
8. Request for either "age" or "location", whichever was provided as a permission within the token creation step
9. Execute the query
10. Profit?
