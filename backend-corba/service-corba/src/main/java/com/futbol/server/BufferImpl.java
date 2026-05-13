package com.futbol.server;

import java.util.ArrayList;
import java.util.List;
import BufferApp.*;

/**
 * Implementación del Gestor de Noticias (SOLO MEMORIA).
 * La persistencia se gestionará mediante carga masiva desde el Frontend.
 */
public class BufferImpl extends _NewsServiceImplBase {

    private List<NewsItem> noticias;

    public BufferImpl() {
        // Iniciamos totalmente vacío, sin archivos ni semillas
        noticias = new ArrayList<>();
        System.out.println("\n=== GESTOR DE NOTICIAS CORBA (IN-MEMORY) ===");
        System.out.println("=== Esperando carga de datos desde el cliente ===");
        System.out.println("============================================\n");
    }

    @Override
    public synchronized void addNews(NewsItem noticia) {
        noticias.add(noticia);
        System.out.println("[CREATE] Noticia recibida: " + noticia.title);
    }

    @Override
    public synchronized void bulkAddNews(NewsItem[] nuevasNoticias) {
        if (nuevasNoticias != null) {
            for (NewsItem n : nuevasNoticias) {
                noticias.add(n);
            }
            System.out.println("[BULK] Se han cargado " + nuevasNoticias.length + " noticias masivamente.");
        }
    }

    @Override
    public synchronized boolean updateNews(NewsItem noticiaModificada) {
        for (int i = 0; i < noticias.size(); i++) {
            if (noticias.get(i).id.equals(noticiaModificada.id)) {
                noticias.set(i, noticiaModificada);
                System.out.println("[UPDATE] Noticia actualizada: " + noticiaModificada.title);
                return true;
            }
        }
        return false;
    }

    @Override
    public synchronized boolean deleteNews(String id) {
        boolean eliminado = noticias.removeIf(n -> n.id.equals(id));
        if (eliminado) {
            System.out.println("[DELETE] ID eliminado: " + id);
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
        System.out.println("Cerrando gestor (Datos volátiles eliminados)...");
    }
}