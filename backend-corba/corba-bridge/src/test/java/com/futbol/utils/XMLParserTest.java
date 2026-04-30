package com.futbol.utils;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import org.w3c.dom.Document;

/**
 * Tests para XMLParser: Verifica el parseo de XML a DOM y extracción de texto.
 */
public class XMLParserTest {

    @Test
    void testParse_xmlBienFormado() throws Exception {
        String xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><noticia><id>123</id></noticia>";
        Document doc = XMLParser.parse(xml);
        
        assertNotNull(doc, "El Document no debe ser null");
        assertEquals("noticia", doc.getDocumentElement().getTagName());
    }

    @Test
    void testGetText_elementoExistente() throws Exception {
        String xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><noticia><id>456</id><title>Test</title></noticia>";
        Document doc = XMLParser.parse(xml);

        assertEquals("456", XMLParser.getText(doc, "id"));
        assertEquals("Test", XMLParser.getText(doc, "title"));
    }

    @Test
    void testGetText_elementoInexistente() throws Exception {
        String xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><noticia><id>789</id></noticia>";
        Document doc = XMLParser.parse(xml);

        assertEquals("", XMLParser.getText(doc, "noExiste"), "Debe devolver cadena vacía si el elemento no existe");
    }

    @Test
    void testParse_xmlMalFormado_lanzaExcepcion() {
        String xmlRoto = "<noticia><id>sin cierre";
        assertThrows(Exception.class, () -> XMLParser.parse(xmlRoto));
    }
}
