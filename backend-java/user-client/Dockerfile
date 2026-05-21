FROM maven:3.8.1-openjdk-11 as builder

WORKDIR /app

COPY . .

RUN mvn clean package -DskipTests

FROM openjdk:11-jre-slim

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8083

ENTRYPOINT ["java", "-Xmx512m", "-jar", "app.jar"]
