# syntax=docker/dockerfile:1

FROM node:22-alpine AS frontend
WORKDIR /src/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend
WORKDIR /src
COPY nothing/nothing.csproj nothing/
RUN dotnet restore nothing/nothing.csproj
COPY nothing/ nothing/
RUN dotnet publish nothing/nothing.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish \
    -p:BuildFrontend=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=backend /app/publish ./
COPY --from=frontend /src/frontend/dist ./wwwroot

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
RUN mkdir /keys && chown $APP_UID:$APP_UID /keys
USER $APP_UID

ENTRYPOINT ["dotnet", "nothing.dll"]
