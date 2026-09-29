# Se construye desde la raíz del repositorio (el servidor usa las reglas compartidas de src/domain):
#   docker build -f server/Dockerfile -t nidos-servidor .
FROM node:22-alpine

WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server/src ./server/src
COPY server/migraciones ./server/migraciones
COPY src/domain ./src/domain
COPY src/sync/paquete.ts ./src/sync/paquete.ts

ENV NODE_ENV=production PORT=3000
EXPOSE 3000
USER node
CMD ["node_modules/.bin/tsx", "server/src/index.ts"]
