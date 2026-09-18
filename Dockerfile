# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Auth ships OFF in the deployed build (same invariant the test suite
# enforces via .grok/app-env.json, which .dockerignore excludes).
ENV NITRO_PRESET=node-server \
    VITE_AUTH_ENABLED=false
# AdSense display unit ids and the Ad Manager rewarded unit path. Empty (the
# default) keeps the reserved placeholders; deploy.yml fills them from the
# repo's Actions variables once the units exist in the AdSense console.
ARG VITE_ADSENSE_SLOT_AIRPORT=""
ARG VITE_ADSENSE_SLOT_COUNTRY=""
ARG VITE_ADSENSE_SLOT_SIDEBAR=""
ARG VITE_REWARDED_AD_UNIT=""
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=3000
COPY --from=build /app/.output ./.output
EXPOSE 3000
USER node
CMD ["node", ".output/server/index.mjs"]
