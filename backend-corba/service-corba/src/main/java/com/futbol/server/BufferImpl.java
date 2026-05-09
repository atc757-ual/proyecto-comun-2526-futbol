package com.futbol.server;

import java.util.ArrayList;
import java.util.List;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import BufferApp.*;

/**
 * Implementación del Gestor de Noticias (Usando nombres originales: title, content, tags).
 */
public class BufferImpl extends _NewsServiceImplBase {

    private List<NewsItem> noticias;

    public BufferImpl() {
        noticias = new ArrayList<>();
        seedData();
        System.out.println("\n=== GESTOR DE NOTICIAS DE FÚTBOL INICIADO ===");
        System.out.println("=== " + noticias.size() + " noticias cargadas por defecto ===");
        System.out.println("============================================\n");
    }

    private void seedData() {
        try {
            System.out.println("[INIT] Cargando noticias desde archivo externo...");
            // Leemos el archivo desde los recursos
            InputStream is = getClass().getClassLoader().getResourceAsStream("news-seeds.txt");
            if (is == null) {
                System.err.println("[ERROR] No se encontró news-seeds.txt en los recursos.");
                return;
            }

            BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
            String line;
            
            // Variables temporales para construir la noticia
            String id = "", title = "", author = "", content = "", summary = "", imageUrl = "", category = "", date = "";
            boolean isActive = true, isFeatured = false;
            java.util.List<String> tags = new java.util.ArrayList<>();

            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) {
                    if (line.startsWith("#")) id = line.substring(1).trim();
                    continue;
                }
                
                if (line.equals("---")) {
                    // Guardamos la noticia acumulada
                    noticias.add(new NewsItem(id, title, author, content, summary, imageUrl, category, tags.toArray(new String[0]), date, isActive, isFeatured));
                    // Reset para la siguiente
                    tags = new java.util.ArrayList<>();
                    continue;
                }

                if (line.startsWith("TITLE:")) title = line.substring(6).trim();
                else if (line.startsWith("AUTHOR:")) author = line.substring(7).trim();
                else if (line.startsWith("DATE:")) date = line.substring(5).trim();
                else if (line.startsWith("CATEGORY:")) category = line.substring(9).trim();
                else if (line.startsWith("ACTIVE:")) isActive = Boolean.parseBoolean(line.substring(7).trim());
                else if (line.startsWith("FEATURED:")) isFeatured = Boolean.parseBoolean(line.substring(9).trim());
                else if (line.startsWith("IMAGE:")) imageUrl = line.substring(6).trim();
                else if (line.startsWith("TAGS:")) {
                    String[] tArr = line.substring(5).split(",");
                    for(String t : tArr) tags.add(t.trim());
                }
                else if (line.startsWith("SUMMARY:")) summary = line.substring(8).trim();
                else if (line.startsWith("CONTENT:")) content = line.substring(8).trim();
            }
            
            // Añadir la última si no termina en ---
            if (!id.isEmpty()) {
                noticias.add(new NewsItem(id, title, author, content, summary, imageUrl, category, tags.toArray(new String[0]), date, isActive, isFeatured));
            }

            System.out.println("[SUCCESS] Se han cargado " + noticias.size() + " noticias.");
            reader.close();
        } catch (Exception e) {
            System.err.println("[ERROR] Fallo al cargar semillas: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Override
    public synchronized void addNews(NewsItem noticia) {
        noticias.add(noticia);
        System.out.println("[CREATE] Noticia añadida: \"" + noticia.title + "\" (ID: " + noticia.id + ", Featured: " + noticia.isFeatured + ")");
    }

    @Override
    public synchronized boolean updateNews(NewsItem noticiaModificada) {
        for (int i = 0; i < noticias.size(); i++) {
            if (noticias.get(i).id.equals(noticiaModificada.id)) {
                noticias.set(i, noticiaModificada);
                System.out.println("[UPDATE] Noticia actualizada: \"" + noticiaModificada.title + "\" (Featured: " + noticiaModificada.isFeatured + ")");
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
    public synchronized NewsItem[] getVisibleNews() {
        System.out.println("[READ] Listando noticias visibles (activas)");
        return noticias.stream()
                .filter(n -> n.isActive)
                .sorted((a, b) -> b.date.compareTo(a.date)) // Orden descendente
                .toArray(NewsItem[]::new);
    }

    @Override
    public synchronized NewsItem[] getFeaturedNews() {
        System.out.println("[READ] Listando noticias destacadas");
        return noticias.stream()
                .filter(n -> n.isActive && n.isFeatured)
                .sorted((a, b) -> b.date.compareTo(a.date)) // Orden descendente
                .toArray(NewsItem[]::new);
    }

    @Override
    public synchronized NewsItem[] getRecentNews() {
        System.out.println("[READ] Listando 5 noticias más recientes");
        return noticias.stream()
                .filter(n -> n.isActive)
                .sorted((a, b) -> b.date.compareTo(a.date)) // Orden descendente
                .limit(5)
                .toArray(NewsItem[]::new);
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