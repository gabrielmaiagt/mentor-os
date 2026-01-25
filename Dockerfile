# Build stage
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist

# Cloud Run sets the PORT env variable defaulting to 8080
ENV PORT=8080
EXPOSE 8080

# Start serve on the specified port
CMD ["sh", "-c", "serve -s dist -l $PORT"]
