package com.futbol.utils;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import BufferApp.NewsItem;

/**
 * Tests para XMLDecoder: Verifica la deserialización de XML a NewsItem.
 */
public class XMLDecoderTest {

    @Test
    void testDecode_camposSimples() throws Exception {
        NewsItem original = crearNoticiaValida();
        String xml = XMLCoder.toXML(original);

        NewsItem decodificada = XMLDecoder.decode(xml);

        assertEquals("001", decodificada.id);
        assertEquals("30/04/2026", decodificada.date);
        assertEquals("Bellingham anota un hat-trick", decodificada.title);
        assertEquals("Carlos Pérez Redactor", decodificada.author);
        assertEquals("https://img.futbol.com/bellingham.jpg", decodificada.imageUrl);
        assertEquals("Resultados", decodificada.category);
    }

    @Test
    void testDecode_tags() throws Exception {
        NewsItem original = crearNoticiaValida();
        String xml = XMLCoder.toXML(original);

        NewsItem decodificada = XMLDecoder.decode(xml);

        assertNotNull(decodificada.tags);
        assertEquals(2, decodificada.tags.length);
        assertEquals("futbol", decodificada.tags[0]);
        assertEquals("champions", decodificada.tags[1]);
    }

    @Test
    void testDecode_cicloCompleto() throws Exception {
        // Encoder -> Decoder debe devolver el mismo objeto
        NewsItem original = crearNoticiaValida();
        String xml = XMLCoder.toXML(original);
        NewsItem resultado = XMLDecoder.decode(xml);

        assertEquals(original.id, resultado.id);
        assertEquals(original.title, resultado.title);
        assertEquals(original.content, resultado.content);
        assertEquals(original.author, resultado.author);
        assertEquals(original.date, resultado.date);
        assertEquals(original.category, resultado.category);
        assertEquals(original.imageUrl, resultado.imageUrl);
        assertArrayEquals(original.tags, resultado.tags);
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
