# Aegis Institute — Cloudflare Workers Build

This version is built for **Cloudflare Workers Builds**, not Cloudflare Pages.

It keeps the same public portal, Discord login, authorised-role editor, and D1 storage.

## Project structure

- `public/index.html` — public portal
- `public/admin.html` — editor portal
- `public/app.js` — frontend logic
- `public/styles.css` — styling
- `worker.js` — API, Discord OAuth, sessions, and D1 logic
- `wrangler.toml` — Workers configuration
- `schema.sql` — D1 table

Cloudflare Workers supports a Worker script and static assets together. This project uses `public/` as the static-assets directory and runs the Worker first only for `/api/*`. See the current Cloudflare Workers static-assets documentation for this configuration.

## 1. Put the files in your existing repository

Replace the old Pages-style project files with the contents of this ZIP.

Do **not** create a second Cloudflare website/page.

Your existing Workers Builds settings should continue to use:

- Build command: `None`
- Deploy command: `npx wrangler deploy`
- Root directory: `/`
- Production branch: `main`

## 2. Configure `wrangler.toml`

Leave this line as a placeholder until you have the real D1 ID:

`database_id = "PUT-YOUR-D1-DATABASE-ID-HERE"`

If your existing D1 database already has a different name or ID, use that existing database's values instead of creating another database.

## 3. Create/prepare D1

The database must contain the `portal_content` table from `schema.sql`.

If you already created `aegis-portal`, keep it. Do not make another one just for this deployment.

## 4. Worker environment variables/secrets

In the Worker project's **Settings → Variables and Secrets**, add:

- `DISCORD_CLIENT_ID` — your Discord application client ID
- `DISCORD_CLIENT_SECRET` — secret
- `DISCORD_GUILD_ID` — your Discord server ID
- `DISCORD_REDIRECT_URI` — `https://YOUR-DOMAIN/api/auth/callback`
- `AUTHORIZED_ROLE_IDS` — comma-separated Discord role IDs, e.g. `123,456,789`
- `SESSION_SECRET` — long random secret

Do not put the Discord client secret or session secret into HTML, JavaScript, or CSS.

The **Workers Builds API token** belongs in the Cloudflare **Settings → Builds** API token field. It is separate from the runtime variables above.

## 5. Discord OAuth2

In your Discord application's OAuth2 settings, add exactly the same callback URL used for `DISCORD_REDIRECT_URI`:

`https://YOUR-DOMAIN/api/auth/callback`

The application requests these scopes:

- `identify`
- `guilds.members.read`

The Worker checks the signed-in user's roles in the configured Discord guild before allowing editor access.

## 6. Deploy

Your existing Workers Builds project should automatically run:

`npx wrangler deploy`

You can also test manually from the repository with:

`npx wrangler deploy`

## 7. First test

1. Open the public Worker URL.
2. Confirm the dashboard loads without Discord login.
3. Click **Sign in with Discord**.
4. Authorise the Discord application.
5. If your Discord account has one of the IDs in `AUTHORIZED_ROLE_IDS`, you should be sent to `admin.html`.
6. Add/edit a department and save it.
7. Refresh the public dashboard and confirm the change appears.

## 8. If the public page works but editing fails

Check these in order:

1. D1 binding is named `DB`.
2. The D1 database ID in `wrangler.toml` is correct.
3. `schema.sql` has been applied.
4. `DISCORD_CLIENT_SECRET` is present as a secret.
5. `SESSION_SECRET` is present as a secret.
6. `DISCORD_GUILD_ID` is the correct server ID.
7. `AUTHORIZED_ROLE_IDS` contains the correct role IDs.
8. The Discord OAuth callback URL exactly matches `DISCORD_REDIRECT_URI`.

## Security

The Discord client secret is only used server-side by `worker.js`.

The editor API checks the signed session server-side before accepting changes.

The OAuth state cookie is validated to protect the login callback.

If an API/build token was exposed in a screen recording or chat, rotate/revoke that token before continuing.
