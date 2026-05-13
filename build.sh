#!/bin/bash
set -e

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
JAVA_HOME=/home/mpt/jdk21 /home/mpt/apache-maven-3.9.9/bin/mvn clean package -DskipTests

echo "=== Build complete ==="
echo "Run with: java -jar backend/target/teambrain-0.0.1.jar"
