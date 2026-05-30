# Memoria Técnica: Ingeniería del Frontend y Capacidades Nativas

**Proyecto:** FutbolClub Mobile & Web Platform  
**Asignatura:** Proyectos de Ingeniería del Software  
**Tecnologías:** Angular 19, Ionic 8, Capacitor 8, Firebase  

---

## 1. Arquitectura de Software y Estructuración de Componentes
La arquitectura del frontend se rige por los principios de **Clean Architecture** y modularidad funcional. Con la adopción de **Angular 19**, se ha implementado un patrón de **Standalone Components**, eliminando la necesidad de módulos tradicionales y permitiendo un árbol de dependencias más ligero y eficiente.

- **Core Layer (`/core`):** Centraliza la lógica transversal, servicios singleton e interceptores.
- **Features Layer (`/features`):** Organización por dominios de negocio (Auth, Players, AI-Team), lo que facilita el mantenimiento y la escalabilidad.
- **Shared Layer (`/shared`):** Contiene componentes visuales reutilizables y utilidades comunes, respetando el principio **DRY (Don't Repeat Yourself)**.

---

## 2. Sistema de Navegación y Enrutamiento (Routing)
La navegación se gestiona mediante el `AppRoutingModule`, utilizando un esquema de **Lazy Loading** (carga perezosa) para cada módulo funcional. Esto optimiza el rendimiento inicial de la aplicación, cargando solo el código necesario para la vista actual.

- **Navegación Nativa:** Se utiliza el `NavController` de Ionic para gestionar el stack de navegación, proporcionando transiciones fluidas de "adelante/atrás" que imitan el comportamiento de una app nativa en dispositivos móviles.
- **Protección de Rutas:** Implementación de **Guards (`AuthGuard`)** que interceptan la navegación para asegurar que el acceso a funcionalidades de gestión esté restringido a usuarios autenticados.

---

## 3. Inyección de Dependencias y Servicios Angular
La comunicación entre la interfaz de usuario y la lógica de negocio se realiza mediante el patrón de **Inyección de Dependencias**.

- **Servicios Reactivos:** El uso de servicios como `AuthService` o `PlatformService` permite un desacoplamiento total. Se emplean **BehaviorSubjects** de RxJS para mantener un estado reactivo y sincronizado de la aplicación (por ejemplo, el estado de la sesión o la selección del backend activo).
- **Uso del `inject()`:** Se utiliza la sintaxis moderna de Angular `inject()` para una gestión de dependencias más limpia y legible dentro de los componentes.

---

## 4. Interoperabilidad con Hardware: Geolocalización y Almacenamiento
Se ha integrado **Capacitor 8** para salvar la brecha entre el navegador y el hardware del dispositivo móvil.

- **Geolocalización:** Mediante el plugin `@capacitor/geolocation`, la aplicación captura coordenadas precisas necesarias para el reporte de scouting. El sistema gestiona automáticamente el ciclo de vida de los permisos del sistema operativo.
- **Persistencia Local:** La gestión del almacenamiento se realiza de forma híbrida, utilizando `localStorage` para preferencias de configuración y una capa de abstracción para datos persistentes de sesión, garantizando la continuidad de la experiencia tras el cierre de la app.

---

## 5. Captura Multimedia y Gestión de Imágenes
La gestión de la identidad visual de los jugadores se apoya en el hardware de la cámara del dispositivo.

- **Acceso a Cámara:** Uso de `@capacitor/camera` para permitir a los usuarios capturar fotos en tiempo real o seleccionarlas de la galería.
- **Procesamiento de Imágenes:** La aplicación gestiona la codificación de las capturas (Base64/Blob) y su posterior carga hacia el almacenamiento en la nube, optimizando el ancho de banda.

---

## 6. Autenticación y Registro vía Firebase
La identidad del usuario se gestiona mediante el SDK de **Firebase Authentication**.

- **Registro Dinámico:** Proceso de creación de cuentas con validación de datos en tiempo real.
- **Seguridad:** El flujo de autenticación incluye la verificación de tokens en el lado del servidor y la gestión de estados de cuenta (activa/inactiva). La integración es transparente para el usuario, permitiendo un inicio de sesión seguro y persistente.

---

## 7. Estrategia de Calidad: Testing Unitario y E2E
Se ha implementado una robusta suite de pruebas para garantizar la estabilidad del software ante cambios:

- **Pruebas Unitarias:** Uso de **Jasmine y Karma** para verificar el comportamiento de servicios críticos y la renderización de componentes.
- **Pruebas End-to-End (E2E):** Implementación de dos escenarios críticos con **Cypress**:
    1. Flujo completo de autenticación y acceso al dashboard.
    2. Búsqueda, filtrado e importación de jugadores desde APIs externas.

---

## 8. Despliegue Nativo: Artefacto APK
La aplicación no se limita al entorno web; se ha transformado en un binario nativo para Android.

- **Compilación:** Uso de Gradle y Android Studio para generar una **APK firmada**.
- **Instalación:** El artefacto permite la ejecución en smartphones reales, permitiendo validar el acceso a la cámara y al GPS en entornos de movilidad fuera de un navegador estándar.

---

## 9. Identidad Visual y Experiencia de Usuario (UX)
La aplicación presenta un estilo personalizado que refuerza la marca del club:

- **Iconografía:** Integración de `ionicons` personalizados para una navegación intuitiva.
- **Splash Screen:** Pantalla de carga configurada para proporcionar una sensación de robustez durante la inicialización de los servicios de Firebase y el descubrimiento de microservicios.
- **Diseño Adaptativo:** Uso de variables CSS dinámicas para asegurar que la interfaz sea cómoda tanto en tablets como en teléfonos de diferentes resoluciones.

---

## 10. Conclusión sobre la Calidad del Material
El código sigue las guías de estilo oficiales de Angular, con un fuerte enfoque en la legibilidad y la seguridad (tipado estricto con TypeScript y esquemas Zod). El informe y las interfaces web reflejan un acabado profesional orientado a la producción industrial de software.

---

### 🔗 Enlaces y Recursos de Interés
| Recurso | Punto de Acceso |
|---|---|
| **Repositorio de Código** | `https://github.com/atc757-ual/proyecto-comun-2526-futbol` |
| **Documentación de API** | `http://localhost:3000/api-docs` |
| **Dashboard de Salud** | `http://localhost:3000/status` |

---
<div align="center">
  <sub>Memoria técnica enfocada al frontend. Generada para la evaluación de proyectos 2025/2026.</sub>
</div>
