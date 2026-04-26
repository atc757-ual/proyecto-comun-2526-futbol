# 🌐 Centralized Configuration Repository

Este repositorio contiene todos los archivos de configuración dinámicos para el ecosistema de microservicios del proyecto **Fútbol 25/26**.

## 🏗️ Estructura de Archivos

| Archivo | Descripción |
| :--- | :--- |
| `application.yml` | **Configuración Global**. Atributos compartidos por todos los microservicios (logs, OpenAPI base, etc). |
| `player-service.yml` | Configuración específica para el microservicio de Jugadores (Puerto 8081). |
| `comment-service.yml` | Configuración específica para el microservicio de Comentarios (Puerto 8082). |

## ⚙️ Funcionamiento

Este repositorio es consumido por el **Config Server** (`service-config` en el backend) mediante el protocolo de archivos local o Git.

- **Desacoplamiento**: Puedes cambiar la base de datos o los puertos aquí sin tener que recompilar el código Java de los microservicios.
- **Jerarquía**: Las propiedades definidas en archivos específicos (ej: `player-service.yml`) sobrescriben a las de `application.yml`.

## 👤 Contacto
- **Autor**: Alex Taquila Camasca
- **Email**: atc757@inlumine.ual.es
- **LinkedIn**: [Perfil Profesional](https://es.linkedin.com/in/alextaquilacamasca)

---
*Gestionado mediante Spring Cloud Config Server* ☁️🤖
