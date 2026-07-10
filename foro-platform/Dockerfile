FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml ./
COPY backend ./backend
RUN mvn -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S foro && adduser -S foro -G foro
COPY --from=build /src/target/foro.war /app/foro.war
USER foro
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/foro.war"]
