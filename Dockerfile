# Stage 1: Build
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /build

# Build frontend
COPY frontend/ frontend/
WORKDIR /build/frontend
RUN npm install && npm run build

# Build backend
WORKDIR /build
COPY backend/ backend/
WORKDIR /build/backend
RUN ./mvnw clean package -DskipTests 2>/dev/null || mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy Aiven CA cert and import into truststore
COPY ca.pem /app/ca.pem
RUN keytool -importcert -noprompt -trustcacerts \
    -alias aiven-ca \
    -file /app/ca.pem \
    -keystore $JAVA_HOME/lib/security/cacerts \
    -storepass changeit

# Copy built JAR
COPY --from=builder /build/backend/target/teambrain-0.0.1.jar app.jar

# Copy frontend static into JAR (mounted as overlay at runtime via spring.web.resources.static-locations)
# The frontend is already embedded in the JAR by build.sh equivalent in Stage 1

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
