package com.futbol.server;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import BufferApp.*;

/**
 * Tests con nombres originales (title, content, tags).
 */
public class BufferImplTest {

    private BufferImpl gestor;

    @BeforeEach
    void setUp() {
        gestor = new BufferImpl();
    }

    @Test
    void testAddAndGetAllNews() {
        NewsItem n = createNews("1", "Noticia Test");
        gestor.addNews(n);
        
        NewsItem[] lista = gestor.getAllNews();
        assertEquals(1, lista.length);
        assertEquals("Noticia Test", lista[0].title);
    }

    private NewsItem createNews(String id, String title) {
        NewsItem n = new NewsItem();
        n.id = id;
        n.title = title;
        n.content = "Contenido con longitud suficiente para el XSD de 20 caracteres";
        n.author = "Admin";
        n.date = "30/04/2024";
        n.category = "Deportes";
        n.tags = new String[]{"futbol", "test"};
        n.imageUrl = "http://img.com/test.png";
        return n;
    }
}
