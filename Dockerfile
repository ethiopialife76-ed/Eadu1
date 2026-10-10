FROM node:24-alpine

WORKDIR /app

# Install build dependencies if needed
COPY package*.json ./

RUN npm ci --only=production

# Copy application files
COPY server/ ./server/
COPY public/ ./public/

# Create uploads directories
RUN mkdir -p uploads/images uploads/documents uploads/audio uploads/videos uploads/avatars data

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server/index.js"]
