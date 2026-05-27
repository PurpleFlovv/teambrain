FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy Aiven CA cert for SSL
COPY ca.pem /app/ca.pem

# Import CA cert into JVM truststore
RUN keytool -importcert -noprompt -trustcacerts \
    -alias aiven-ca \
    -file /app/ca.pem \
    -keystore $JAVA_HOME/lib/security/cacerts \
    -storepass changeit

# Copy the built JAR
COPY backend/target/teambrain-0.0.1.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
