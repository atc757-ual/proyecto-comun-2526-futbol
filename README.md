<div align="center">

# ⚽ FutbolClub Platform

**Plataforma full-stack de gestión y scouting de fútbol**

[![CI/CD Pipeline](https://github.com/atc757-ual/proyecto-comun-2526-futbol/actions/workflows/main.yml/badge.svg)](https://github.com/atc757-ual/proyecto-comun-2526-futbol/actions/workflows/main.yml)
[![SonarCloud](https://sonarcloud.io/api/project_badges/measure?project=atc757-ual_proyecto-comun-2526-futbol&metric=alert_status)](https://sonarcloud.io/project/overview?id=atc757-ual_proyecto-comun-2526-futbol)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=atc757-ual_proyecto-comun-2526-futbol&metric=coverage)](https://sonarcloud.io/project/overview?id=atc757-ual_proyecto-comun-2526-futbol)
[![Angular](https://img.shields.io/badge/Angular-19-DD0031?logo=angular)](https://angular.io)
[![Ionic](https://img.shields.io/badge/Ionic-8-3880FF?logo=ionic)](https://ionicframework.com)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.1.5-6DB33F?logo=springboot)](https://spring.io/projects/spring-boot)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com)

</div>

---

## 📋 Tabla de contenidos

- [Descripción](#-descripción)
- [Arquitectura del sistema](#-arquitectura-del-sistema)
- [Decisiones de diseño](#-decisiones-de-diseño)
- [Stack tecnológico](#-stack-tecnológico)
- [Funcionalidades](#-funcionalidades)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Puesta en marcha](#-puesta-en-marcha)
- [Variables de entorno](#-variables-de-entorno)
- [CI/CD y despliegue automático](#-cicd-y-despliegue-automático)
- [Tests y calidad de código](#-tests-y-calidad-de-código)
- [API Documentation](#-api-documentation)
- [Base de datos](#-base-de-datos)
- [Solución de problemas](#-solución-de-problemas)

---

## 🎯 Descripción

FutbolClub es una plataforma **full-stack** y **multiplataforma** (web + iOS + Android) para la gestión de canteras de fútbol. Permite a clubes y ojeadores:

- Gestionar su plantilla de jugadores con datos completos y foto
- Importar jugadores desde ligas reales vía **TheSportsDB API**
- Analizar equipos con **Inteligencia Artificial** (Google Gemini)
- Publicar y consumir noticias a través de un sistema legado **CORBA**
- Localizar geográficamente a jugadores y scouting con GPS

El proyecto demuestra una **arquitectura polígota** de nivel profesional que combina tecnologías modernas con integración de sistemas legados.

---

## 🏗 Arquitectura del sistema

### Vista general

```
                        ┌─────────────────────────────┐
                        │         CLIENTE              │
                        │   Angular 19 + Ionic 8       │
                        │   Web · iOS · Android · PWA  │
                        └──────────────┬───────────────┘
                                       │ HTTPS
                                       ▼
                        ┌─────────────────────────────┐
                        │     NGINX REVERSE PROXY      │
                        │  SSL/TLS · Let's Encrypt     │
                        └──────┬──────────────┬────────┘
                               │              │
               ┌───────────────┘              └──────────────────┐
               │                                                  │
               ▼                                                  ▼
┌──────────────────────────┐                  ┌───────────────────────────────┐
│     Backend Node.js      │                  │    Spring Cloud Gateway       │
│     Express · MongoDB    │                  │         Puerto 8080            │
│     Puerto 3000          │                  └────────┬──────────┬───────────┘
│                          │                           │          │
│  · Auth (JWT + Firebase) │          ┌────────────────┤          ├──────────────────┐
│  · Comentarios           │          │                │          │                  │
│  · IA (Gemini)           │          ▼                ▼          ▼                  ▼
│  · Geocodificación       │   ┌──────────┐   ┌──────────┐ ┌──────────┐    ┌──────────────┐
│  · APIs externas         │   │ player-  │   │ comment- │ │  user-   │    │  external-   │
└──────────┬───────────────┘   │ client   │   │ client   │ │  client  │    │  client      │
           │                   │ :8081    │   │ :8082    │ │ :8083    │    │  :8085       │
           ▼                   └─────┬────┘   └────┬─────┘ └──────────┘    │  (IA + APIs) │
      ┌─────────┐                    │             │                        └──────────────┘
      │ MongoDB │                    └──────┬──────┘
      └─────────┘                           ▼
                                    ┌──────────────┐     ┌────────────────────┐
                                    │  PostgreSQL  │     │  Spring Cloud Stack │
                                    └──────────────┘     │  Config    :8888    │
                                                         │  Eureka    :8761    │
                                                         └────────────────────┘
                                    ┌────────────────────────────────┐
                                    │        CORBA Bridge :8089       │
                                    │   REST ↔ CORBA (Noticias)      │
                                    └─────────────────────────────────┘
```

### Servicios y puertos

| Servicio | Puerto | Tecnología | Responsabilidad |
|---|---|---|---|
| `frontend` | 80 | Angular + Nginx | Aplicación web/PWA |
| `backend-node` | 3000 | Express.js | Auth, comentarios, IA, geocodificación |
| `gateway` | 8080 | Spring Cloud Gateway | Punto de entrada Java, validación JWT |
| `player-client` | 8081 | Spring Boot + JPA | CRUD jugadores (PostgreSQL) |
| `comment-client` | 8082 | Spring Boot + JPA | CRUD comentarios (PostgreSQL) |
| `user-client` | 8083 | Spring Boot + JPA | Gestión usuarios |
| `external-client` | 8085 | Spring Boot | TheSportsDB, IA, geocodificación |
| `corba-bridge` | 8089 | Java Servlet | Adaptador REST ↔ CORBA |
| `config-server` | 8888 | Spring Cloud Config | Configuración centralizada |
| `eureka-server` | 8761 | Spring Eureka | Registro de servicios |
| `mongo` | 27017 | MongoDB 4.4 | Base de datos documental |
| `postgres` | 5432 | PostgreSQL 15 | Base de datos relacional |

---

## 🧠 Decisiones de diseño

### ¿Por qué dos backends?

La arquitectura usa **dos backends independientes** con responsabilidades distintas:

- **Node.js + MongoDB**: Ideal para datos en tiempo real, esquemas flexibles (comentarios, perfiles de usuario, favoritos) y operaciones de IA con LangChain. Su naturaleza asíncrona encaja con la integración de APIs externas.
- **Java + Spring Boot**: Gestiona los datos estructurados y críticos del dominio (jugadores, estadísticas). Los microservicios permiten escalar independientemente cada funcionalidad y usan PostgreSQL para garantizar consistencia transaccional.

### ¿Por qué microservicios en Java?

Cada microservicio Java tiene su propia base de datos y puede escalar, desplegarse y mantenerse de forma independiente. Spring Cloud proporciona de forma nativa:
- **Config Server**: Un único punto de configuración para todos los servicios
- **Eureka**: Descubrimiento automático sin configurar IPs estáticas
- **Gateway**: Validación JWT centralizada, enrutamiento y balanceo de carga

### ¿Por qué integrar CORBA?

El sistema de noticias utiliza un servicio CORBA preexistente (sistema legado). En lugar de reescribirlo, se implementó un **bridge REST ↔ CORBA** que adapta el protocolo sin tocar el código legado. Esto demuestra integración de sistemas heterogéneos, un requisito habitual en entornos empresariales.

### ¿Por qué Angular + Ionic + Capacitor?

Un único codebase que genera:
- **Web** (PWA con Angular)
- **iOS nativa** (Capacitor)
- **Android nativa** (Capacitor)

Capacitor proporciona acceso a APIs nativas reales (cámara, GPS, filesystem, haptics) con una capa de abstracción que funciona igual en web y móvil.

### ¿Por qué una Stencil Library?

Los componentes de jugadores (`player-card`, `player-list`) se construyen como **web components estándar** con Stencil. Esto los hace reutilizables en cualquier framework (React, Vue, vanilla JS) sin dependencia de Angular.

---

## 🛠 Stack tecnológico

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| Angular | 19.0 | Framework principal (standalone components) |
| Ionic | 8.0 | Componentes UI + shell móvil |
| Capacitor | 8.x | Bridges nativos: cámara, GPS, filesystem |
| TypeScript | 5.6 | Lenguaje |
| Firebase | 11.10 | Autenticación social (Google, email) |
| Stencil | latest | Librería de web components |
| Leaflet | 1.9.4 | Mapas interactivos |
| Swiper | 12.1 | Carruseles y sliders |
| Cypress | latest | Tests E2E (Chrome + Firefox) |
| Jasmine / Karma | latest | Tests unitarios |

### Backend Node.js
| Tecnología | Versión | Uso |
|---|---|---|
| Express | 5.2 | Framework HTTP |
| MongoDB / Mongoose | 9.6 | Base de datos y ODM |
| LangChain + Gemini | latest | Análisis de equipo con IA |
| Firebase Admin | 10.3 | Verificación de tokens Firebase |
| JWT + RSA 2048 | 9.0 | Autenticación segura |
| Zod | 3.23 | Validación de esquemas |
| Opossum | 9.0 | Circuit breaker pattern |
| Jest | latest | Tests unitarios (75% cobertura mínima) |

### Backend Java
| Tecnología | Versión | Uso |
|---|---|---|
| Spring Boot | 3.1.5 | Framework microservicios |
| Spring Cloud | 2022.0.4 | Config, Eureka, Gateway, Feign |
| Spring Data JPA | latest | ORM para PostgreSQL |
| LangChain4j | 0.34 | IA integrada en microservicios |
| SpringDoc OpenAPI | 2.2 | Swagger automático |
| JaCoCo | latest | Cobertura de código |
| JUnit 5 | latest | Tests unitarios |

### Infraestructura
| Tecnología | Uso |
|---|---|
| Docker + Compose | Orquestación de 15+ contenedores |
| Nginx | Reverse proxy + terminación SSL |
| Let's Encrypt + ACME | Certificados SSL automáticos |
| GitHub Actions | Pipeline CI/CD completo |
| GHCR | Registro de imágenes Docker |
| SonarCloud | Análisis continuo de calidad |

---

## ✨ Funcionalidades

### 👤 Gestión de jugadores
- CRUD completo con foto (cámara nativa o galería)
- Importación masiva desde **TheSportsDB**: busca por liga → equipo → jugador
- Búsqueda por nombre, equipo, liga, nacionalidad o posición
- Jugadores destacados (`isFeatured`) y favoritos por usuario
- Vista pública sin autenticación para scouting externo

### 🤖 IA — Análisis de equipo (`/ai-team`)
- Selección visual de hasta 11 jugadores
- Análisis táctico generado por **Google Gemini**: formación óptima, fortalezas, debilidades
- Recomendaciones de fichajes según perfiles

### 💬 Comentarios y scouting geolocalizado
- Valoraciones de 1 a 5 estrellas con comentario de texto
- **GPS obligatorio** para publicar: cada opinión lleva coordenadas reales
- Geocodificación inversa (muestra ciudad/país del scout)
- Paginación de comentarios con avatares

### 📰 Noticias (sistema CORBA)
- Feed de noticias servido por el **servicio CORBA legado**
- Panel de administración para crear, editar, activar/desactivar noticias
- Filtrado por categoría y etiquetas

### 🗺 Mapas y geolocalización
- Mapa Leaflet con ubicación de jugadores
- Índice geoespacial en MongoDB para consultas de proximidad
- Tarjeta de estado de permiso GPS en tiempo real

### 🔐 Autenticación y seguridad
- Login con **Firebase** (email/contraseña + proveedores sociales)
- Tokens **JWT** firmados con RSA 2048 (clave privada, clave pública)
- Roles: `user`, `admin`, `master`
- Interceptor HTTP que refresca el token automáticamente
- Panel admin: activar/desactivar usuarios, ver actividad

### 📱 Multiplataforma
- Aplicación web (Angular SPA + PWA)
- App nativa iOS / Android vía **Capacitor**
- Cámara nativa para captura de foto de jugadores
- Detección de tipo de red (WiFi vs. móvil)

---

## 📁 Estructura del proyecto

```
proyecto-comun-2526-futbol/
│
├── frontend-angular-ionic/          # Angular 19 + Ionic 8
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                # Guards, interceptors, modelos, servicios
│   │   │   │   ├── guards/          # Auth guard
│   │   │   │   ├── interceptors/    # JWT interceptor, error handling
│   │   │   │   ├── models/          # Interfaces: Player, Comment, News, User
│   │   │   │   ├── plugins/         # Wrappers Capacitor (camera, location)
│   │   │   │   └── services/        # Auth, players, news, AI, platform...
│   │   │   ├── features/            # Módulos de funcionalidad
│   │   │   │   ├── home/
│   │   │   │   ├── players/
│   │   │   │   ├── busqueda/        # Búsqueda: liga → equipo → jugador
│   │   │   │   ├── ai-team/
│   │   │   │   ├── news/
│   │   │   │   ├── auth/
│   │   │   │   ├── profile/
│   │   │   │   └── admin/
│   │   │   └── shared/              # Componentes, pipes, utilidades comunes
│   │   └── environments/            # environment.ts / environment.prod.ts
│   ├── cypress/e2e/                 # Tests E2E: login, register, home, busqueda...
│   ├── nginx.conf                   # Proxy rules para backends en producción
│   └── Dockerfile                   # Multi-stage: Node build → Nginx serve
│
├── backend-node/                    # Express.js + MongoDB
│   ├── app_api/
│   │   ├── controllers/             # auth, players, comments, news, ai, geo
│   │   ├── models/                  # Esquemas Mongoose
│   │   ├── routes/                  # Todos los endpoints (documentados con Swagger)
│   │   └── services/                # ai.service, storage.service, geo.service
│   ├── __tests__/                   # Jest: tests por controlador/servicio
│   ├── private_key.pem              # RSA (gitignore, se genera en CI)
│   └── server.js                    # Entry point + Swagger setup
│
├── backend-java/                    # Spring Boot microservicios (Maven multi-módulo)
│   ├── pom.xml                      # Parent POM (11 módulos)
│   ├── config-server/               # Spring Cloud Config
│   ├── eureka-server/               # Service registry
│   ├── gateway/                     # API Gateway + JWT validation
│   ├── player-client/               # Microservicio jugadores (JPA + PostgreSQL)
│   ├── comment-client/              # Microservicio comentarios
│   ├── user-client/                 # Microservicio usuarios
│   ├── external-client/             # TheSportsDB + IA + CORBA bridge
│   ├── common-futbol/               # DTOs y modelos compartidos
│   └── springboot-config/           # Ficheros YAML de configuración por servicio
│
├── backend-corba/                   # Sistema legado CORBA
│   ├── corba-bridge/                # Adaptador REST ↔ CORBA (Servlet)
│   │   └── src/main/java/
│   │       ├── servlet/             # HTTP endpoints → llamadas CORBA
│   │       ├── idl/                 # Clases generadas del IDL
│   │       └── xml/                 # XMLParser, XMLCoder, XMLDecoder
│   ├── service-corba/               # Servicio CORBA de noticias
│   └── Dockerfile.corba             # Build multi-stage CORBA
│
├── stencil-library/                 # Web components (Stencil)
│   └── src/components/
│       ├── player-card/             # player-card.tsx
│       └── player-list/             # player-list.tsx
│
├── nginx/                           # Reverse proxy producción
│   └── nginx.conf
├── docker-compose.yml               # Orquestación completa (15+ servicios)
├── .env.example                     # Plantilla de variables de entorno
├── .sonarcloud.properties           # Configuración SonarCloud
└── .github/workflows/main.yml       # Pipeline CI/CD completo
```

---

## 🚀 Puesta en marcha

### Requisitos previos

| Herramienta | Versión mínima | Necesario para |
|---|---|---|
| Docker + Compose | 24+ | Todo (despliegue) |
| Node.js | 20+ | Desarrollo frontend |
| Java JDK | 17 | Desarrollo backend Java |
| Maven | 3.8+ | Build backend Java |

### Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/atc757-ual/proyecto-comun-2526-futbol.git
cd proyecto-comun-2526-futbol
```

### Paso 2 — Obtener las claves de API necesarias

Necesitarás:

| Clave | Dónde obtenerla | Para qué |
|---|---|---|
| `GOOGLE_API_KEY` | [Google Cloud Console](https://console.cloud.google.com) → Habilitar Gemini API + Maps API | IA + geocodificación |
| `FOOTBALL_API_KEY` | [TheSportsDB](https://www.thesportsdb.com/api.php) (plan gratuito) | Datos de ligas y jugadores |
| Firebase config | [Firebase Console](https://console.firebase.google.com) → Nuevo proyecto → Web app | Autenticación |

### Paso 3 — Configurar Firebase

1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Activar **Authentication** → Email/contraseña
3. Descargar las credenciales de administrador (JSON) y guardarlo como `backend-node/firebase-credentials.json`
4. Copiar la configuración web en `frontend-angular-ionic/src/environments/environment.ts`:

```typescript
firebase: {
  apiKey: "tu-api-key",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  // ...
}
```

### Paso 4 — Configurar las variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus valores (ver sección [Variables de entorno](#-variables-de-entorno)).

### Paso 5 — Generar clave RSA para JWT

```bash
cd backend-node
openssl genrsa -out private_key.pem 2048
openssl rsa -in private_key.pem -pubout -out public_key.pem
cd ..
```

### Paso 6 — Levantar los servicios

```bash
# Levantar todo
docker compose up -d

# Ver logs en tiempo real
docker compose logs -f

# Ver estado de los contenedores
docker compose ps
```

> **Nota:** La primera vez tardará varios minutos porque descarga las imágenes base y compila el proyecto Java.

### Paso 7 — Verificar que todo funciona

| URL | Qué verificar |
|---|---|
| http://localhost | Aplicación web cargada |
| http://localhost:8761 | Eureka: todos los servicios registrados |
| http://localhost:3000/status | Dashboard de salud Node.js |
| http://localhost:8080/swagger-ui.html | Swagger del Gateway Java |

### Desarrollo local del frontend

```bash
# 1. Construir la stencil library (necesario la primera vez)
cd stencil-library
npm install
npm run build

# 2. Instalar dependencias del frontend
cd ../frontend-angular-ionic
npm install

# 3. Iniciar servidor de desarrollo (apunta a los backends en Docker)
npx ionic serve
```

---

## 🔐 Variables de entorno

```env
# ─── Google APIs ─────────────────────────────────────
GOOGLE_API_KEY=AIza...             # Gemini AI + Maps Geocoding

# ─── TheSportsDB ─────────────────────────────────────
FOOTBALL_API_KEY=3                 # Plan gratuito (solo lectura básica)
TSDB_PREMIUM_KEY=xxxxxx            # Plan premium (plantillas completas)

# ─── Seguridad ───────────────────────────────────────
JWT_SECRET=un-secreto-muy-largo-y-aleatorio

# ─── MongoDB (Backend Node) ──────────────────────────
MONGO_URL=mongodb://mongo:27017/football

# ─── PostgreSQL (Backend Java) ───────────────────────
DB_USER=user
DB_PASSWORD=password
DB_NAME=football

# ─── Producción (perfil vm, opcional en local) ───────
VIRTUAL_HOST=futbolclub.duckdns.org
LETSENCRYPT_HOST=futbolclub.duckdns.org
LETSENCRYPT_EMAIL=tu@email.com
```

---

## ⚙ CI/CD y despliegue automático

### Pipeline de GitHub Actions

El pipeline ejecuta **5 jobs en paralelo** ante cada push a `develop` o `main`:

```
push a develop / PR
        │
        ├── frontend job ──────────────────────────────────────────────────┐
        │   1. npm install (stencil + frontend)                            │
        │   2. ng test (Karma + Jasmine, ChromeHeadless)                   │
        │   3. Cypress E2E Chrome (ng build + http-server)                 │
        │   4. Cypress E2E Firefox                                         │
        │   5. Docker build & push → ghcr.io/.../football-frontend:latest  │
        │                                                                  │
        ├── backend-node job ──────────────────────────────────────────────┤
        │   1. MongoDB service (health check)                              │
        │   2. npm install + generar RSA temporal                          │
        │   3. Jest tests (umbral 75%)                                     │
        │   4. Docker build & push → football-node:latest                  │
        │                                                                  │
        ├── backend-java job ─────────────────────────────────────────────┤
        │   1. PostgreSQL service                                          │
        │   2. mvn test (JaCoCo coverage)                                  │
        │   3. mvn clean install                                           │
        │   4. SonarCloud scan                                             │
        │   5. Docker build & push × 7 microservicios                     │
        │                                                                  │
        ├── service-corba job ────────────────────────────────────────────┤
        │   1. JDK 11                                                      │
        │   2. mvn test + build                                            │
        │   3. Docker build & push → football-corba:latest                 │
        │                                                                  │
        └── (todos completos) ────────────────────────────────────────────┘
                │
                │ Solo en push a main
                ▼
        deploy job
           SSH → VM
           docker login ghcr.io
           docker compose pull
           docker compose up -d --remove-orphans
           docker image prune -f
```

### Imágenes publicadas en GHCR

| Imagen | Descripción |
|---|---|
| `ghcr.io/.../football-frontend:latest` | Angular + Nginx |
| `ghcr.io/.../football-node:latest` | Express.js backend |
| `ghcr.io/.../football-config-server:latest` | Spring Cloud Config |
| `ghcr.io/.../football-eureka-server:latest` | Eureka registry |
| `ghcr.io/.../football-gateway:latest` | API Gateway |
| `ghcr.io/.../football-player-client:latest` | Microservicio jugadores |
| `ghcr.io/.../football-comment-client:latest` | Microservicio comentarios |
| `ghcr.io/.../football-external-client:latest` | APIs externas + IA |
| `ghcr.io/.../football-corba:latest` | CORBA bridge |

### Secrets necesarios en GitHub

| Secret | Descripción |
|---|---|
| `VM_HOST` | IP pública o dominio de la VM de producción |
| `VM_USERNAME` | Usuario SSH de la VM |
| `VM_SSH_KEY` | Clave privada SSH (contenido completo del fichero) |
| `SONAR_TOKEN` | Token de SonarCloud para análisis de calidad |
| `SONAR_ORGANIZATION` | Organización en SonarCloud |

---

## 🧪 Tests y calidad de código

### Frontend

```bash
cd frontend-angular-ionic

# Tests unitarios (Jasmine + Karma)
npx ng test --watch=false --browsers=ChromeHeadlessNoSandbox --code-coverage

# Tests E2E — requiere la app corriendo en :4200
npx ng serve &
npx cypress run --browser chrome
npx cypress run --browser firefox

# Tests E2E con la build de producción
npx ng build --configuration=production
npx http-server dist/frontend-angular-ionic/browser -p 4200 --silent &
npx cypress run
```

**Suites E2E implementadas:**
- `login.cy.ts` — Flujos de autenticación (éxito, error, cuenta desactivada)
- `register.cy.ts` — Registro con validaciones
- `home.cy.ts` — Dashboard principal
- `busqueda.cy.ts` — Búsqueda: ligas → equipos → jugadores → cesta de importación → GPS
- `players-public.cy.ts` — Vista pública de jugadores y detalle
- `leagues.cy.ts` — Búsqueda y selección de ligas

### Backend Node.js

```bash
cd backend-node
npm test               # Jest con umbral de cobertura 75%
npm run test:coverage  # Genera reporte HTML en /coverage
```

### Backend Java

```bash
cd backend-java

# Tests unitarios + JaCoCo
mvn test -pl player-client,comment-client -am

# Ver reporte de cobertura
open player-client/target/site/jacoco/index.html
```

### Calidad de código — SonarCloud

El análisis automático de SonarCloud evalúa:
- Cobertura de tests
- Bugs y code smells
- Vulnerabilidades de seguridad
- Duplicaciones de código (CPD)

[![SonarCloud](https://sonarcloud.io/api/project_badges/measure?project=atc757-ual_proyecto-comun-2526-futbol&metric=alert_status)](https://sonarcloud.io/project/overview?id=atc757-ual_proyecto-comun-2526-futbol)

---

## 📖 API Documentation

### Swagger / OpenAPI

| Servicio | URL local | Descripción |
|---|---|---|
| Backend Node.js | `http://localhost:3000/api-docs` | Todos los endpoints REST |
| Spring Gateway | `http://localhost:8080/swagger-ui.html` | Entrada unificada Java |
| Player Service | `http://localhost:8081/swagger-ui.html` | CRUD jugadores |
| Comment Service | `http://localhost:8082/swagger-ui.html` | CRUD comentarios |

### Endpoints principales (Node.js)

```
GET    /api/players              → Listar jugadores (con filtros)
POST   /api/players              → Crear jugador
GET    /api/players/:id          → Obtener jugador con comentarios
PUT    /api/players/:id          → Actualizar jugador
DELETE /api/players/:id          → Eliminar jugador

GET    /api/players/public       → Vista pública (sin auth)
GET    /api/players/public/:id   → Detalle público

POST   /api/players/:id/comments → Añadir comentario (requiere GPS)
GET    /api/players/:id/comments → Listar comentarios

POST   /api/ai/analyze-team      → Análisis IA del equipo seleccionado

GET    /api/news                 → Feed de noticias (desde CORBA)
POST   /api/news                 → Crear noticia (admin)

GET    /api/geo?lat=X&lon=Y     → Geocodificación inversa
GET    /api/external/search-leagues?name=X    → Buscar ligas
GET    /api/external/teams-by-league/:id      → Equipos de una liga
GET    /api/external/players-by-team/:id      → Jugadores de un equipo

POST   /api/auth/register        → Registro de usuario
POST   /api/auth/login           → Login (devuelve JWT)
GET    /status                   → Dashboard de salud del servidor
```

---

## 🗄 Base de datos

### MongoDB (Backend Node.js)

```
Colecciones:
  players    → { name, team, league, nationality, position, age,
                 image_url, user_id, is_featured, is_favorite,
                 external_id, tsdb_id, location: {type, coordinates},
                 social_media, comments[] }

  comments   → { content, rating, autor_name, user_id, player_id,
                 location: {city, country, coordinates}, created_at }

  users      → { email, password_hash, role, favorites[],
                 isActive, created_at }

  news       → { title, summary, content, author, category,
                 tags[], imageUrl, isActive, created_at }
```

### PostgreSQL (Backend Java)

```sql
-- player_client DB
players  (id, name, team, league, nationality, position, age,
          image_url, user_id, is_featured, external_id, created_at)

-- comment_client DB
comments (id, content, rating, autor_name, user_id, player_id,
          latitude, longitude, city, country, created_at)

-- user_client DB
users    (id, email, password_hash, role, is_active,
          firebase_uid, created_at)
```

---

## 🛠 Solución de problemas

### Los servicios Java no arrancan

```bash
# Esperar a que config-server y eureka-server estén healthy
docker compose logs config-server
docker compose logs eureka-server

# Los servicios dependen del config-server, forzar reinicio
docker compose restart player-client comment-client
```

### Error de conexión a MongoDB

```bash
# Verificar que mongo está corriendo y healthy
docker compose ps mongo
docker compose logs mongo

# Verificar la URL de conexión en .env
echo $MONGO_URL  # debe ser mongodb://mongo:27017/football
```

### El frontend no conecta con los backends

```bash
# En desarrollo local, los backends deben estar corriendo en Docker
docker compose up -d

# Verificar que los puertos están expuestos
curl http://localhost:3000/status
curl http://localhost:8080/actuator/health
```

### Error de clave RSA en Node.js

```bash
# Regenerar las claves RSA
cd backend-node
openssl genrsa -out private_key.pem 2048
openssl rsa -in private_key.pem -pubout -out public_key.pem
```

### Cypress falla en CI

Los tests E2E usan credenciales reales. En entorno local, asegúrate de que:
1. La app está corriendo en `http://localhost:4200`
2. El usuario `atc757@inlumine.ual.es` existe en la base de datos
3. Los backends están accesibles desde el frontend

---

## 👥 Autor

**Alex** — [@atc757-ual](https://github.com/atc757-ual)

Proyecto desarrollado como trabajo final — Curso 2025/2026

---

<div align="center">
  <sub>Construido con ❤ y mucho ☕</sub>
</div>
