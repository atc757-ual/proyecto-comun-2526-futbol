package com.futbol.utils;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import BufferApp.NewsItem;

/**
 * Tests para XMLCoder: Verifica la serialización de NewsItem a XML.
 */
public class XMLCoderTest {

    @Test
    void testToXML_contieneTodasLasEtiquetas() {
        NewsItem n = crearNoticiaValida();
        String xml = XMLCoder.toXML(n);

        assertTrue(xml.contains("<id>"), "Debe contener etiqueta <id>");
        assertTrue(xml.contains("<date>"), "Debe contener etiqueta <date>");
        assertTrue(xml.contains("<title>"), "Debe contener etiqueta <title>");
        assertTrue(xml.contains("<author>"), "Debe contener etiqueta <author>");
        assertTrue(xml.contains("<content>"), "Debe contener etiqueta <content>");
        assertTrue(xml.contains("<imageUrl>"), "Debe contener etiqueta <imageUrl>");
        assertTrue(xml.contains("<category>"), "Debe contener etiqueta <category>");
        assertTrue(xml.contains("<tags>"), "Debe contener etiqueta <tags>");
        assertTrue(xml.contains("<tag>"), "Debe contener al menos una etiqueta <tag>");
    }

    @Test
    void testToXML_valoresCorrectos() {
        NewsItem n = crearNoticiaValida();
        String xml = XMLCoder.toXML(n);

        assertTrue(xml.contains("<id>001</id>"));
        assertTrue(xml.contains("<date>30/04/2026</date>"));
        assertTrue(xml.contains("<title>Bellingham anota un hat-trick</title>"));
        assertTrue(xml.contains("<author>Carlos Pérez Redactor</author>"));
        assertTrue(xml.contains("<category>Resultados</category>"));
        assertTrue(xml.contains("<tag>futbol</tag>"));
        assertTrue(xml.contains("<tag>champions</tag>"));
    }

    @Test
    void testToXML_generaXMLBienFormado() {
        NewsItem n = crearNoticiaValida();
        String xml = XMLCoder.toXML(n);

        assertTrue(xml.startsWith("<?xml version=\"1.0\" encoding=\"UTF-8\"?>"));
        assertTrue(xml.contains("<noticia>"));
        assertTrue(xml.endsWith("</noticia>"));
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
