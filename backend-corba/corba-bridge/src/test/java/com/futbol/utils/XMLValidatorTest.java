package com.futbol.utils;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import BufferApp.NewsItem;

/**
 * Tests para XMLValidator: Verifica la validación XSD contra noticias.xsd.
 */
public class XMLValidatorTest {

    // Ruta al XSD en el proyecto
    private static final String XSD_PATH = "src/main/resources/noticias.xsd";

    @Test
    void testValidar_noticiaValida() throws Exception {
        NewsItem n = crearNoticiaValida();
        String xml = XMLCoder.toXML(n);

        // No debe lanzar excepción
        boolean resultado = XMLValidator.validar(xml, XSD_PATH);
        assertTrue(resultado, "Una noticia válida debe pasar la validación XSD");
    }

    @Test
    void testValidar_fechaInvalida() {
        NewsItem n = crearNoticiaValida();
        n.date = "2026-04-30"; // Formato incorrecto, se espera DD/MM/YYYY
        String xml = XMLCoder.toXML(n);

        assertThrows(org.xml.sax.SAXException.class, () -> 
            XMLValidator.validar(xml, XSD_PATH),
            "Debe fallar con fecha en formato incorrecto"
        );
    }

    @Test
    void testValidar_tituloMuyCorto() {
        NewsItem n = crearNoticiaValida();
        n.title = "Hola"; // Solo 4 caracteres, mínimo es 5
        String xml = XMLCoder.toXML(n);

        assertThrows(org.xml.sax.SAXException.class, () -> 
            XMLValidator.validar(xml, XSD_PATH),
            "Debe fallar con título demasiado corto"
        );
    }

    @Test
    void testValidar_urlInvalida() {
        NewsItem n = crearNoticiaValida();
        n.imageUrl = "no-es-una-url"; // No empieza por http:// ni https://
        String xml = XMLCoder.toXML(n);

        assertThrows(org.xml.sax.SAXException.class, () -> 
            XMLValidator.validar(xml, XSD_PATH),
            "Debe fallar con URL inválida"
        );
    }

    @Test
    void testValidar_categoriaInvalida() {
        NewsItem n = crearNoticiaValida();
        n.category = "CategoriaInventada"; // No está en el enum del XSD
        String xml = XMLCoder.toXML(n);

        assertThrows(org.xml.sax.SAXException.class, () -> 
            XMLValidator.validar(xml, XSD_PATH),
            "Debe fallar con categoría no permitida"
        );
    }

    @Test
    void testValidar_sinTags() {
        NewsItem n = crearNoticiaValida();
        n.tags = new String[]{}; // Mínimo 1 tag según XSD
        String xml = XMLCoder.toXML(n);

        assertThrows(org.xml.sax.SAXException.class, () -> 
            XMLValidator.validar(xml, XSD_PATH),
            "Debe fallar sin etiquetas (mínimo 1)"
        );
    }

    private NewsItem crearNoticiaValida() {
        NewsItem n = new NewsItem();
        n.id = "001";
        n.date = "30/04/2026";
        n.title = "Bellingham anota un hat-trick";
        n.author = "Carlos Pérez Redactor";
        n.content = "El centrocampista inglés Jude Bellingham anotó tres goles en la victoria del Real Madrid";
        n.imageUrl = "https://img.futbol.com/bellingham.jpg";
        n.category = "Resultados";
        n.tags = new String[]{"futbol", "champions"};
        return n;
    }
}
