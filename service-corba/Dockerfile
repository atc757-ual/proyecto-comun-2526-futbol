# Stage 1: Build
FROM maven:3.8.5-openjdk-11 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package

# Stage 2: Run
FROM eclipse-temurin:11-jre-focal
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
# Puerto típico para Naming Service de CORBA
EXPOSE 1050 
ENTRYPOINT ["java", "-cp", "app.jar", "com.futbol.corba.NewsServer"]
