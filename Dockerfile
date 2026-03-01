# Stage 1: Build frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production backend
FROM node:18-alpine
WORKDIR /app/backend

# Install ca-certificates for DocumentDB TLS
RUN apk add --no-cache ca-certificates

# Download the Amazon DocumentDB CA bundle
ADD https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem /app/rds-combined-ca-bundle.pem

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY backend/src/ ./src/

# Copy frontend build — Express references path.join(__dirname, '../../frontend/build')
# __dirname = /app/backend/src → ../../frontend/build = /app/frontend/build
COPY --from=frontend-build /app/frontend/build /app/frontend/build

EXPOSE 5000

ENV NODE_ENV=production
CMD ["node", "src/index.js"]
