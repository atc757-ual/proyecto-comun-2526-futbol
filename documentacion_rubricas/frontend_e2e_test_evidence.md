# Evidencia de Pruebas End-to-End (E2E) del Frontend

**Fecha de ejecución:** 2026-05-22  
**Proyecto:** `frontend-angular-ionic`  
**Ámbito de este documento:** Pruebas End-to-End (E2E) con Cypress  
**Estado general:** ✅ VÁLIDO (100% de pruebas superadas)

---

## 1. Resumen Ejecutivo

Este documento reúne la evidencia de ejecución y éxito de la batería de pruebas **End-to-End (E2E)** sobre el frontend de la aplicación. Las pruebas simulan el comportamiento real del usuario final interactuando con las páginas, validando flujos de datos completos y la integración con las APIs de backend (CORBA Bridge y servicios REST de Java).

La ejecución completa se ha realizado inicialmente utilizando el navegador **Google Chrome**.

---

## 2. Entorno de Ejecución (Chrome)

- **Cypress Version:** 15.15.0  
- **Browser:** Chrome 148 (headless)  
- **Node.js Version:** v24.15.0  
- **Base URL:** `http://127.0.0.1:4200`  
- **Sistema Operativo:** Windows  

---

## 3. Resultados Globales (Chrome E2E)

| Métrica | Resultado |
| :--- | :--- |
| **Specs Ejecutadas** | 14 |
| **Tests Totales** | 95 |
| **Pruebas Superadas (Passing)** | 95 |
| **Pruebas Fallidas (Failing)** | 0 |
| **Pruebas Pendientes (Pending)** | 0 |
| **Pruebas Omitidas (Skipped)** | 0 |
| **Duración Total** | 7 minutos y 9 segundos |

---

## 4. Detalle por Spec (Chrome E2E)

A continuación se presenta el desglose de tiempo y resultados por cada archivo de especificación ejecutado:

| # | Spec File | Tests Ejecutados | Tests Aprobados | Tiempo de Ejecución | Estado |
| :---: | :--- | :---: | :---: | :---: | :---: |
| 1 | `ai-team.cy.ts` | 3 | 3 | 31s | ✅ OK |
| 2 | `busqueda.cy.ts` | 23 | 23 | 2m 23s | ✅ OK |
| 3 | `forgot-password.cy.ts` | 2 | 2 | 8s | ✅ OK |
| 4 | `home.cy.ts` | 6 | 6 | 41s | ✅ OK |
| 5 | `leagues.cy.ts` | 5 | 5 | 28s | ✅ OK |
| 6 | `login.cy.ts` | 5 | 5 | 20s | ✅ OK |
| 7 | `manage-news.cy.ts` | 4 | 4 | 24s | ✅ OK |
| 8 | `news.cy.ts` | 2 | 2 | 12s | ✅ OK |
| 9 | `permission-modal.cy.ts` | 2 | 2 | 2s | ✅ OK |
| 10 | `players-public.cy.ts` | 30 | 30 | 46s | ✅ OK |
| 11 | `players.cy.ts` | 5 | 5 | 25s | ✅ OK |
| 12 | `profile.cy.ts` | 3 | 3 | 16s | ✅ OK |
| 13 | `register.cy.ts` | 2 | 2 | 10s | ✅ OK |
| 14 | `security.cy.ts` | 3 | 3 | 16s | ✅ OK |
| **Total** | **14 Specs** | **95 Tests** | **95 Tests** | **7m 09s** | **✅ COMPLETADO** |

---

## 5. Áreas Funcionales Cubiertas

El conjunto de pruebas asegura la integridad de los siguientes flujos de negocio:

* **Búsqueda e Importación Avanzada (`busqueda.cy.ts` / `leagues.cy.ts`)**: Cobertura de flujos interactivos de selección y descarte de jugadores en el basket, validaciones de permisos de GPS requeridos y validación de toast de advertencia.
* **Inteligencia Artificial (`ai-team.cy.ts`)**: Validación de recomendaciones de plantillas, enlaces sugeridos y comportamiento dinámico del asistente.
* **Panel de Control y Widgets (`home.cy.ts`)**: Renderizado de los widgets de StencilJS (`player-list`, `tv-schedule`), verificación de la navegación diaria en la programación de TV e integraciones con páginas de análisis de IA.
* **Flujos de Autenticación (`login.cy.ts` / `register.cy.ts` / `forgot-password.cy.ts`)**: Casos reales y simulados (correos inválidos, cuentas bloqueadas, reestablecimiento de clave con tokens en URL).
* **Gestión de Contenido y Noticias (`news.cy.ts` / `manage-news.cy.ts`)**: Lectura de noticias, controles administrativos de noticias y permisos basados en roles.
* **Detalle Público y Privado de Jugadores (`players-public.cy.ts` / `players.cy.ts`)**: Fichas de estadísticas de jugadores, paginación de listados, comentarios valorados con estrellas y banner de scout.

---

## 6. Resultados en Edge (headless)

---
### Resumen de ejecución (Edge)
Ejecuté la suite completa de pruebas end‑to‑end en **Microsoft Edge 148 (headless)**, utilizando la misma configuración y los mismos stubs que en Chrome. Todas las pruebas se ejecutaron sin fallos, confirmando la compatibilidad del front‑end con este navegador. La duración total fue de 7 min 06 s, lo que evidencia la estabilidad y velocidad de la aplicación en Edge.
Aquí describimos los resultados obtenidos al correr la suite completa en **Microsoft Edge 148 (headless)**. Se utilizó la misma configuración que en Chrome, manteniendo los mismos *stubs* y comandos. Todas las 95 pruebas pasaron sin fallos, con una duración total de **7 min 06 s**, lo que confirma la compatibilidad del front‑end con Edge.

#### Tabla de resultados por spec

| Spec | Tests | Passing | Failing | Duration |
| --- | --- | --- | --- | --- |
| ai-team.cy.ts | 3 | 3 | 0 | 00:26 |
| busqueda.cy.ts | 23 | 23 | 0 | 01:57 |
| forgot-password.cy.ts | 2 | 2 | 0 | 00:08 |
| home.cy.ts | 6 | 6 | 0 | 00:40 |
| leagues.cy.ts | 5 | 5 | 0 | 00:42 |
| login.cy.ts | 5 | 5 | 0 | 00:24 |
| manage-news.cy.ts | 4 | 4 | 0 | 00:34 |
| news.cy.ts | 2 | 2 | 0 | 00:15 |
| permission-modal.cy.ts | 2 | 2 | 0 | 00:02 |
| players-public.cy.ts | 30 | 30 | 0 | 00:45 |
| players.cy.ts | 5 | 5 | 0 | 00:25 |
| profile.cy.ts | 3 | 3 | 0 | 00:15 |
| register.cy.ts | 2 | 2 | 0 | 00:10 |
| security.cy.ts | 3 | 3 | 0 | 00:17 |

**Total:** 95 tests, 95 passing, 0 failing, 07:06 total duration.

---
