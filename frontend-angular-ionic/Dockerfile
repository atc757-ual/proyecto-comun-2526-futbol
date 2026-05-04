# Etapa 1: Construcción
FROM node:24-slim AS build
WORKDIR /app

# Instalamos las dependencias
COPY package*.json ./
RUN npm install

# Copiamos el resto del código y construimos
COPY . .
RUN npm run build -- --configuration production

# Etapa 2: Servidor de producción (Nginx)
FROM nginx:alpine
COPY --from=build /app/www /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
