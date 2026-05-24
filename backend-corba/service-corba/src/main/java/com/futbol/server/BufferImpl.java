package com.futbol.server;

import java.util.ArrayList;
import java.util.List;
import BufferApp.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Implementación del Gestor de Noticias (SOLO MEMORIA).
 * La persistencia se gestionará mediante carga masiva desde el Frontend.
 */
public class BufferImpl extends _NewsServiceImplBase {

    private static final Logger logger = LoggerFactory.getLogger(BufferImpl.class);

    private List<NewsItem> noticias;

    public BufferImpl() {
        noticias = new ArrayList<>();
        logger.info("=== GESTOR DE NOTICIAS CORBA (IN-MEMORY) iniciado. Esperando carga de datos. ===");
    }

    @Override
    public synchronized void addNews(NewsItem noticia) {
        noticias.add(noticia);
        logger.info("[CREATE] Noticia recibida: {}", noticia.title);
    }

    @Override
    public synchronized void bulkAddNews(NewsItem[] nuevasNoticias) {
        if (nuevasNoticias != null) {
            for (NewsItem n : nuevasNoticias) {
                noticias.add(n);
            }
            logger.info("[BULK] {} noticias cargadas masivamente.", nuevasNoticias.length);
        }
    }

    @Override
    public synchronized boolean updateNews(NewsItem noticiaModificada) {
        for (int i = 0; i < noticias.size(); i++) {
            if (noticias.get(i).id.equals(noticiaModificada.id)) {
                noticias.set(i, noticiaModificada);
                logger.info("[UPDATE] Noticia actualizada: {}", noticiaModificada.title);
                return true;
            }
        }
        return false;
    }

    @Override
    public synchronized boolean deleteNews(String id) {
        boolean eliminado = noticias.removeIf(n -> n.id.equals(id));
        if (eliminado) {
            logger.info("[DELETE] ID eliminado: {}", id);
        }
        return eliminado;
    }

    @Override
    public synchronized NewsItem[] getAllNews() {
        return noticias.toArray(new NewsItem[0]);
    }

    @Override
    public synchronized NewsItem[] getVisibleNews() {
        return noticias.stream()
                .filter(n -> n.isActive)
                .sorted((a, b) -> b.date.compareTo(a.date))
                .toArray(NewsItem[]::new);
    }

    @Override
    public synchronized NewsItem[] getFeaturedNews() {
        return noticias.stream()
                .filter(n -> n.isActive && n.isFeatured)
                .sorted((a, b) -> b.date.compareTo(a.date))
                .toArray(NewsItem[]::new);
    }

    @Override
    public synchronized NewsItem[] getRecentNews() {
        return noticias.stream()
                .filter(n -> n.isActive)
                .sorted((a, b) -> b.date.compareTo(a.date))
                .limit(5)
                .toArray(NewsItem[]::new);
    }

    @Override
    public synchronized NewsItem getNewsById(String id) {
        return noticias.stream()
                .filter(n -> n.id.equals(id))
                .findFirst()
                .orElse(null);
    }

    @Override
    public void shutdown() {
        logger.info("Cerrando gestor CORBA. Datos volátiles eliminados.");
    }
}
