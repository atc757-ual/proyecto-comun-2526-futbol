package com.futbol.server;

import java.util.ArrayList;
import java.util.List;
import BufferApp.*;

/**
 * Implementación del Gestor de Noticias (Usando nombres originales: title, content, tags).
 */
public class BufferImpl extends _NewsServiceImplBase {

    private List<NewsItem> noticias;

    public BufferImpl() {
        noticias = new ArrayList<>();
        System.out.println("\n=== GESTOR DE NOTICIAS DE FÚTBOL INICIADO ===");
        System.out.println("============================================\n");
    }

    @Override
    public synchronized void addNews(NewsItem noticia) {
        noticias.add(noticia);
        System.out.println("[CREATE] Noticia añadida: \"" + noticia.title + "\" (ID: " + noticia.id + ")");
    }

    @Override
    public synchronized boolean updateNews(NewsItem noticiaModificada) {
        for (int i = 0; i < noticias.size(); i++) {
            if (noticias.get(i).id.equals(noticiaModificada.id)) {
                noticias.set(i, noticiaModificada);
                System.out.println("[UPDATE] Noticia actualizada: \"" + noticiaModificada.title + "\"");
                return true;
            }
        }
        return false;
    }

    @Override
    public synchronized boolean deleteNews(String id) {
        boolean eliminado = noticias.removeIf(n -> n.id.equals(id));
        if (eliminado) {
            System.out.println("[DELETE] Noticia con ID " + id + " eliminada.");
        }
        return eliminado;
    }

    @Override
    public synchronized NewsItem[] getAllNews() {
        System.out.println("[READ] Listando todas las noticias (" + noticias.size() + ")");
        return noticias.toArray(new NewsItem[0]);
    }

    @Override
    public synchronized NewsItem getNewsById(String id) {
        System.out.println("[READ] Buscando noticia con ID: " + id);
        return noticias.stream()
                .filter(n -> n.id.equals(id))
                .findFirst()
                .orElse(null);
    }

    @Override
    public void shutdown() {
        System.out.println("Cerrando gestor de noticias...");
    }
}