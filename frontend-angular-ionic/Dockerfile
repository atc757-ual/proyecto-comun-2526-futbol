# Etapa 1: Construcción
FROM node:24-slim AS build

# IMPORTANTE: Para que este build funcione, se debe ejecutar desde la RAÍZ del repositorio:
# docker build -t frontend -f frontend-angular-ionic/Dockerfile .

WORKDIR /app

# 1. Copiamos y construimos la librería compartida
COPY stencil-library /stencil-library
WORKDIR /stencil-library
RUN npm install && npm run build

# 2. Preparamos el frontend
WORKDIR /app
COPY frontend-angular-ionic/package*.json ./
RUN npm install

# 3. Copiamos el resto del código del frontend
COPY frontend-angular-ionic/ .

# 4. Construimos la aplicación (más memoria para máquinas pequeñas)
ENV NODE_OPTIONS="--max-old-space-size=1536"
RUN npm run build -- --configuration production

# Etapa 2: Servidor de producción (Nginx)
FROM nginx:alpine
COPY --from=build /app/www /usr/share/nginx/html

# Copiamos la configuración de Nginx (usando la ruta relativa al contexto de build)
COPY frontend-angular-ionic/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
