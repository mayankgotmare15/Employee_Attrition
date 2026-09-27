FROM node:20-slim

WORKDIR /app

# Install OpenSSL and CA certificates for Prisma Engine
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY src ./src

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push && node prisma/seed.js && node src/index.js"]

