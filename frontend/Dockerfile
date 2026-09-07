# ========================================================
# Stage 1: Build Application
# ========================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Build-time argument for Vite API URL
ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=${VITE_API_URL}

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application source and build
COPY . .
RUN npm run build

# ========================================================
# Stage 2: Serve with Nginx Alpine
# ========================================================
FROM nginx:alpine

# Remove default nginx html
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration (including try_files for SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
