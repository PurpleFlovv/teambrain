#!/bin/bash
set -e

# Auto-detect JAVA_HOME
if [ -z "$JAVA_HOME" ]; then
    if command -v java &> /dev/null; then
        export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which java))))
    else
        echo "ERROR: Java not found. Set JAVA_HOME or install Java 21."
        exit 1
    fi
fi

# Use mvnw if available, otherwise fall back to system mvn
if [ -f backend/mvnw ]; then
    MVN_CMD="./mvnw"
elif command -v mvn &> /dev/null; then
    MVN_CMD="mvn"
else
    echo "ERROR: Maven not found. Install Maven or add mvnw wrapper."
    exit 1
fi

echo "=== Building frontend ==="
cd frontend
npm install
npm run build

echo "=== Copying frontend to backend static ==="
rm -rf ../backend/src/main/resources/static/*
mkdir -p ../backend/src/main/resources/static
cp -r dist/* ../backend/src/main/resources/static/

echo "=== Building backend ==="
cd ../backend
$MVN_CMD clean package -DskipTests

echo "=== Build complete ==="
echo "Run with: java -jar backend/target/teambrain-0.0.1.jar"
echo "Or: docker build -t teambrain . && docker run -p 8080:8080 teambrain"
