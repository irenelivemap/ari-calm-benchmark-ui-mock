FROM caddy:2.9.1-alpine

WORKDIR /srv/ari-route-arcade

COPY . .
COPY deploy/Caddyfile /etc/caddy/Caddyfile

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
