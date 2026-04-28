# Stage 1: Construir todo el proyecto multimodulo
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /build
# Copiamos el código fuente completo del backend
COPY pom.xml .
COPY config-server ./config-server
COPY eureka-server ./eureka-server
COPY gateway ./gateway
COPY player-client ./player-client
COPY comment-client ./comment-client
COPY player-feign ./player-feign
COPY comment-feign ./comment-feign

# Compilamos todos los microservicios de una vez
RUN mvn clean package -DskipTests

# Stage 2: Imagen final para ejecutar un microservicio específico
FROM eclipse-temurin:17-jre-focal
ARG SERVICE_NAME
WORKDIR /app
# Copiamos el JAR compilado del microservicio específico
COPY --from=build /build/${SERVICE_NAME}/target/*.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]
