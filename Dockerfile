# syntax=docker/dockerfile:1
FROM node:24-alpine3.24 AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:24-alpine3.24 AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund \
    && npm cache clean --force \
    && rm -rf /usr/local/lib/node_modules/npm /opt/yarn-* \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/yarn /usr/local/bin/yarnpkg

COPY --from=builder --chown=node:node /app/build ./build
COPY --chown=node:node README.md LICENSE ./

EXPOSE 8080

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:8080/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]

ENTRYPOINT ["node", "build/index.js"]
CMD ["--transport", "http", "--port", "8080"]
