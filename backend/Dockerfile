# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
# Using frozen-lockfile for deterministic builds
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy the source code
COPY . .

# Build the NestJS application
RUN yarn build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Set node environment to production
ENV NODE_ENV=production

# Copy package files and install only production dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

# Copy the built output from the builder stage
COPY --from=builder /app/dist ./dist

# Expose port 3001 as defined in the main.ts file
EXPOSE 3001

# Start the NestJS application
CMD ["node", "dist/main.js"]
