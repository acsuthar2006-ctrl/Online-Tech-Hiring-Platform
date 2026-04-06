# Build stage
FROM node:18-bullseye AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*
# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy built static assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
