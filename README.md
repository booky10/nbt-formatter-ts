# Nbt Formatter

A simple Express-based http server providing api routes and a simple user frontend for formatting and minifying Minecraft NBT strings.
Can be easily self-hosted, a hosted version is available at [nbt.booky.dev](https://nbt.booky.dev/).

## Self-hosting

First, clone this repository. Then copy `.env.example` to `.env` and configure the environment variables.

If you want to self-host this without using docker:
1. Ensure you have NodeJS installed - if you don't have the yarn package manager installed, replace `yarn` with `.yarn/releases/*` in the following commands
2. Run `yarn install` to install dependencies
3. Run `yarn run build` to build server/client scripts
4. Run `yarn run start:prod` to start the web process

If you want to self-host this using docker:
1. Ensure docker itself and the docker compose plugin are installed
2. Write a `docker-compose.override.yml` which specifies the network configuration of the `app` service, see `docker-compose.override.yml.example` for an example
3. Run `docker compose up -d`

## Environment variables

- `API_REDIR`: The url to redirect to at the `/api` route
  - Default: `https://github.com/booky10/nbt-formatter-ts`
- `HOST`: The host to bind on.
  - Default: `0.0.0.0`
- `PORT`: The port to bind on.
  - Default: `8080`
- `TRUST_PROXY`: Whether to trust headers sent by the client revealing the real client address. Required for rate-limiting to work correctly with e.g. Cloudflare Proxy enabled.
  - Default: `false`
- `FRONTEND_ENABLED`: Whether the frontend pages hosted on the `/` route should be available.
  - Default: `true`
- `FRONTEND_DIRECTORY`: The directory where the frontend pages are located at.
  - Default: `public`

## Available routes

All API routes have a rate-limit of 5 requests per 30s, per ip. After this, every request will get delayed by an additional 200ms.

### GET `/`

This shows a simple user frontend with a textarea for nbt strings.

Example: GET https://nbt.booky.dev/

### GET `/api`

This just redirects to this GitHub repository, or another URL if changed.

Example: GET https://nbt.booky.dev/api

## POST `/api/v1/format?indent=2&resolve=true`

The body of the request should be the nbt string to format.

The query parameter `indent` ranges from `0` to `10` with a default of `2`.
If it is set to `0`, the sent nbt string will be minified. If `1` or greater, everything will be indented with the supplied indention level.

The query parameter `resolve` specifies whether to resolve certain SNBT features, e.g. booleans or SNBT operations.

Example: POST https://nbt.booky.dev/api/v1/format?indent=4
`{ text: "Hello World!", "example:array": [B; true, 1B, 42B ] }`
