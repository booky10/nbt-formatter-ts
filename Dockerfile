FROM node:lts-alpine AS builder

COPY . /work/dirty

# build on a clean copy of this git repo
RUN apk add --update --no-cache git && git clone /work/dirty /work/clean
WORKDIR /work/clean

RUN yarn install && yarn run build

FROM node:lts-slim

USER node
WORKDIR /home/node/app

COPY --from=builder --chown=node:node /work/clean/node_modules /home/node/app/node_modules
COPY --from=builder --chown=node:node /work/clean/public /home/node/app/public
COPY --from=builder --chown=node:node /work/clean/dist /home/node/app/dist

ENTRYPOINT ["/usr/bin/env", "NODE_PATH=/app/node_modules", "NODE_ENV=production"]
CMD ["/usr/local/bin/node", "./dist/index.js"]
