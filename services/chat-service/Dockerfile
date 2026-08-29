# --- build: install deps for the shared lib + this service ---
FROM node:20-alpine AS build
WORKDIR /app
COPY packages/shared ./packages/shared
RUN cd packages/shared && npm install --omit=dev --no-audit --no-fund
COPY services/chat-service ./services/chat-service
RUN cd services/chat-service && npm install --omit=dev --no-audit --no-fund

# --- runtime ---
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache wget \
 && addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app ./
USER app
EXPOSE 4003
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4003/health || exit 1
CMD ["node", "services/chat-service/src/server.js"]
