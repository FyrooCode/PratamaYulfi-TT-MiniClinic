FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install build dependencies for native modules (e.g. bcrypt)
RUN apk add --no-cache python3 make g++

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 5000

# Default run command
CMD ["npm", "start"]
