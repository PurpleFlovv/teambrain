# Stage 1: Build
FROM eclipse-temurin:21-jdk AS builder

# Install Maven and Node.js
RUN apt-get update && apt-get install -y maven nodejs npm && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Build frontend
COPY frontend/ frontend/
WORKDIR /build/frontend
RUN npm install && npm run build

# Build backend with frontend static baked in
WORKDIR /build
COPY backend/ backend/
RUN rm -rf backend/src/main/resources/static/* && \
    mkdir -p backend/src/main/resources/static && \
    cp -r frontend/dist/* backend/src/main/resources/static/
WORKDIR /build/backend
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy built JAR
COPY --from=builder /build/backend/target/teambrain-0.0.1.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
