FROM node:24-alpine
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY backend/src ./src
COPY index.html manifest.json sw.js bangla_scan_logo.svg /app/
COPY assets /app/assets
RUN mkdir -p logs data/media && chown -R node:node /app
USER node
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "src/server.js"]
