# Informe de Pruebas JUnit — Backend CORBA

**Proyecto:** Fútbol 2526 — Sistema CORBA de Gestión de Noticias
**Fecha de ejecución:** 24/05/2026
**Framework:** JUnit Jupiter 5.10.x
**Herramienta de build:** Maven Wrapper (`mvnw`)
**Java:** OpenJDK 1.8.0_482 (Eclipse Temurin)
**Resultado global:** TODAS LAS PRUEBAS SUPERADAS — **17 / 17**

---

## Resumen ejecutivo

| Módulo | Clases de prueba | Tests | Pasados | Fallidos | Errores | Tiempo |
|---|---|---|---|---|---|---|
| `service-corba` | 1 | 1 | 1 | 0 | 0 | 0.125 s |
| `corba-bridge` | 5 | 16 | 16 | 0 | 0 | 0.461 s |
| **TOTAL** | **6** | **17** | **17** | **0** | **0** | **0.586 s** |

---

## service-corba

### `BufferImplTest` — Gestor en memoria CORBA

Verifica el comportamiento del objeto `BufferImpl`, que es la implementación del servant CORBA que almacena las noticias en memoria.

| # | Caso de prueba | Estado | Tiempo |
|---|---|---|---|
| 1 | `testAddAndGetAllNews` — Inserta una noticia y verifica que se recupera correctamente mediante `getAllNews()` | PASS | 0.098 s |

**Salida de log (SLF4J/Logback):**
```
INFO  com.futbol.server.BufferImpl - === GESTOR DE NOTICIAS CORBA (IN-MEMORY) iniciado. Esperando carga de datos. ===
INFO  com.futbol.server.BufferImpl - [CREATE] Noticia recibida: Noticia Test
```

---

## corba-bridge

### `ContractTest` — Contrato de respuesta REST

Verifica que la estructura de respuesta JSON generada por el Bridge cumple con el contrato `ApiResult` definido en el ecosistema.

| # | Caso de prueba | Estado | Tiempo |
|---|---|---|---|
| 1 | `testApiResultStructureAndOrder` — Verifica que la respuesta contiene los campos `result`, `data` en el orden correcto y con los tipos esperados | PASS | 0.237 s |

**Salida:**
```
[CORBA-TEST] Contrato validado con exito usando Jackson.
```

---

### `XMLCoderTest` — Codificación NewsItem → XML

Verifica la transformación de objetos `NewsItem` a representación XML.

| # | Caso de prueba | Estado | Tiempo |
|---|---|---|---|
| 1 | `testToXML_generaXMLBienFormado` — El XML producido puede ser parseado sin errores | PASS | 0.005 s |
| 2 | `testToXML_valoresCorrectos` — Los valores del struct se reflejan correctamente en el XML | PASS | 0.001 s |
| 3 | `testToXML_contieneTodasLasEtiquetas` — El XML incluye todas las etiquetas requeridas por el XSD | PASS | 0.003 s |

---

### `XMLDecoderTest` — Decodificación XML → NewsItem

Verifica el proceso inverso: reconstruir un `NewsItem` a partir de su representación XML.

| # | Caso de prueba | Estado | Tiempo |
|---|---|---|---|
| 1 | `testDecode_cicloCompleto` — Un objeto serializado y deserializado mantiene todos sus campos intactos | PASS | 0.042 s |
| 2 | `testDecode_camposSimples` — Los campos primitivos (título, autor, fecha) se decodifican correctamente | PASS | 0.005 s |
| 3 | `testDecode_tags` — El campo `TagList` (sequence<string>) se reconstruye como array de strings | PASS | 0.005 s |

---

### `XMLParserTest` — Utilidad de parseo XML

Verifica el parser SAX/DOM de bajo nivel utilizado por el pipeline de validación.

| # | Caso de prueba | Estado | Tiempo |
|---|---|---|---|
| 1 | `testParse_xmlBienFormado` — Un documento XML válido se parsea sin excepciones | PASS | 0.003 s |
| 2 | `testParse_xmlMalFormado_lanzaExcepcion` — Un XML mal formado lanza `SAXParseException` | PASS | 0.010 s |
| 3 | `testGetText_elementoExistente` — Extrae el texto de un nodo existente correctamente | PASS | 0.002 s |
| 4 | `testGetText_elementoInexistente` — Devuelve un valor seguro cuando el nodo no existe | PASS | 0.003 s |

> Nota: el mensaje `[Fatal Error] Las estructuras del documento XML deben empezar y finalizar en la misma entidad` es la salida esperada del test de XML malformado — es capturado y verificado por la prueba.

---

### `XMLValidatorTest` — Validación XSD (noticias.xsd)

Verifica el pipeline completo de validación contra el esquema XSD. Cubre tanto la ruta feliz (noticia válida) como seis casos de error que el XSD debe rechazar.

| # | Caso de prueba | Estado | Tiempo | Descripción |
|---|---|---|---|---|
| 1 | `testValidar_noticiaValida` — Una noticia con todos los campos válidos pasa la validación | PASS | 0.009 s | Ruta feliz |
| 2 | `testValidar_fechaInvalida` — El formato `2026-04-30` (ISO) es rechazado; el XSD exige `DD/MM/YYYY` | PASS | 0.008 s | Patrón `\d{2}/\d{2}/\d{4}` |
| 3 | `testValidar_tituloMuyCorto` — Un título de 4 caracteres es rechazado; mínimo 5 | PASS | 0.008 s | Patrón `[\s\S]{5,250}` |
| 4 | `testValidar_urlInvalida` — Una URL sin esquema `http/https` es rechazada | PASS | 0.012 s | Patrón `https?://\S+` |
| 5 | `testValidar_categoriaInvalida` — Una categoría no contemplada en el enum es rechazada | PASS | 0.012 s | Enum XSD de 10 valores |
| 6 | `testValidar_sinTags` — Una noticia sin etiquetas es rechazada; el XSD exige al menos 1 | PASS | 0.060 s | `minOccurs="1"` en `tag` |

---

## Arquitectura de pruebas

```
backend-corba/
├── service-corba/
│   └── src/test/java/com/futbol/server/
│       └── BufferImplTest.java          ← servant CORBA en memoria
│
└── corba-bridge/
    └── src/test/java/com/futbol/
        ├── servlet/
        │   └── ContractTest.java        ← contrato de respuesta JSON
        └── utils/
            ├── XMLCoderTest.java        ← serialización NewsItem→XML
            ├── XMLDecoderTest.java      ← deserialización XML→NewsItem
            ├── XMLParserTest.java       ← utilidad SAX/DOM
            └── XMLValidatorTest.java    ← validación XSD completa
```

### Estrategia de prueba

Las pruebas CORBA son **unitarias puras** — no requieren un ORB activo ni conexión de red. El servidor CORBA (`BufferServer`) y el Bridge (`NoticiasRestServlet`) se prueban de forma desacoplada:

- `BufferImplTest`: instancia directamente `BufferImpl` en memoria, sin `ORB.init()`.
- `ContractTest`: construye un `ObjectMapper` de Jackson y verifica la estructura JSON sin arrancar el servlet.
- `XMLCoderTest / XMLDecoderTest / XMLValidatorTest`: ejercitan el pipeline XML (Coder → Validator → Decoder) con objetos `NewsItem` construidos manualmente.

### Cobertura funcional verificada

| Funcionalidad | Test(s) que la verifican |
|---|---|
| Almacenamiento en memoria (CORBA servant) | `BufferImplTest.testAddAndGetAllNews` |
| Serialización objeto → XML | `XMLCoderTest` (3 tests) |
| Validación XSD — ruta feliz | `XMLValidatorTest.testValidar_noticiaValida` |
| Validación XSD — formatos de fecha | `XMLValidatorTest.testValidar_fechaInvalida` |
| Validación XSD — longitud de campos | `XMLValidatorTest.testValidar_tituloMuyCorto` |
| Validación XSD — URLs | `XMLValidatorTest.testValidar_urlInvalida` |
| Validación XSD — enumeraciones | `XMLValidatorTest.testValidar_categoriaInvalida` |
| Validación XSD — cardinalidad de tags | `XMLValidatorTest.testValidar_sinTags` |
| Deserialización XML → objeto | `XMLDecoderTest` (3 tests) |
| Parseo XML — éxito y fallo | `XMLParserTest` (4 tests) |
| Contrato de respuesta REST | `ContractTest.testApiResultStructureAndOrder` |

---

## Conclusión

El backend CORBA supera la totalidad de las 17 pruebas definidas con un tiempo total de ejecución de **0.586 segundos**. El pipeline de validación XML/XSD, el servant en memoria y el contrato de respuesta JSON están verificados. No hay fallos ni errores.
