FROM nginx:1.27-alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY infra/gateway/nginx.conf /etc/nginx/nginx.conf
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/api/health || exit 1
