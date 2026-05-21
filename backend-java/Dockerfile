# Stage 1: Construir todo el proyecto multimodulo
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /build
# Copiamos el código fuente completo del backend
COPY pom.xml .
COPY config-server ./config-server
COPY eureka-server ./eureka-server
COPY gateway ./gateway
COPY user-client ./user-client
COPY player-client ./player-client
COPY comment-client ./comment-client
COPY player-feign ./player-feign
COPY comment-feign ./comment-feign
COPY external-client ./external-client
COPY external-feign ./external-feign
COPY common-futbol ./common-futbol

# Compilamos todos los microservicios de una vez
RUN mvn clean install -DskipTests

# Stage 2: Imagen final para ejecutar un microservicio específico
FROM eclipse-temurin:17-jre-focal
ARG SERVICE_NAME
WORKDIR /app
# Instalamos curl para los healthchecks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
# Copiamos el JAR compilado desde la etapa de construcción
COPY --from=build /build/${SERVICE_NAME}/target/*.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]
