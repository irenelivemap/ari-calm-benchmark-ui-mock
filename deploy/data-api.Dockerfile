FROM node:20-alpine

WORKDIR /srv/ari-benchmark-data

COPY server/ server/
COPY src/data/calm-benchmark-data.js src/data/calm-benchmark-data.js

ENV DATA_DIR=/data
ENV PORT=8090
VOLUME /data
EXPOSE 8090

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8090/healthz || exit 1

CMD ["node", "server/data-api.js"]
