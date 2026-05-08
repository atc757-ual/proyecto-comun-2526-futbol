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
        seedData();
        System.out.println("\n=== GESTOR DE NOTICIAS DE FÚTBOL INICIADO ===");
        System.out.println("=== " + noticias.size() + " noticias cargadas por defecto ===");
        System.out.println("============================================\n");
    }

    private void seedData() {
        noticias.add(new NewsItem(
            "seed-1", 
            "El Real Madrid conquista su 16ª Champions", 
            "Redacción Deportes", 
            "El partido comenzó con un dominio alterno, pero dos goles en la segunda mitad sellaron el destino del encuentro. Vinicius Jr. fue nombrado MVP tras una actuación estelar.",
            "Una noche histórica en Wembley donde el conjunto blanco demostró por qué es el rey de Europa.",
            "https://images.unsplash.com/photo-1574629810360-7efbbe195018", 
            "Internacional", 
            new String[]{"#Champions", "#RealMadrid", "#Futbol"},
            "22/05/2026", 
            true
        ));

        noticias.add(new NewsItem(
            "seed-2", 
            "Nuevos fichajes para la próxima temporada", 
            "Mercado Fútbol", 
            "Se rumorea que varias estrellas de la Premier League están en conversaciones avanzadas para recalar en La Liga. Las cifras que se barajan superan los 100 millones de euros.",
            "Los grandes clubes europeos ya mueven ficha antes de que abra el mercado oficial.",
            "https://images.unsplash.com/photo-1508098682722-e99c43a406b2", 
            "Fichajes", 
            new String[]{"#Fichajes", "#Mercado", "#LaLiga"},
            "21/05/2026", 
            true
        ));

        noticias.add(new NewsItem(
            "seed-3", 
            "Análisis táctico: La revolución del 4-3-3", 
            "Táctica Pro", 
            "El uso de laterales invertidos y la presión alta se han convertido en las señas de identidad de los entrenadores top. Analizamos los movimientos clave.",
            "Cómo los equipos modernos están adaptando sus sistemas para dominar la posesión.",
            "https://images.unsplash.com/photo-1551958219-acbc608c6377", 
            "Opinión", 
            new String[]{"#Tactica", "#Analisis", "#Entrenadores"},
            "20/05/2026", 
            true
        ));
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
    public synchronized NewsItem[] getVisibleNews() {
        System.out.println("[READ] Listando noticias visibles (activas)");
        return noticias.stream()
                .filter(n -> n.isActive)
                .toArray(NewsItem[]::new);
    }

    @Override
    public synchronized NewsItem[] getRecentNews() {
        System.out.println("[READ] Listando 5 noticias más recientes");
        return noticias.stream()
                .filter(n -> n.isActive)
                .sorted((a, b) -> b.date.compareTo(a.date)) // Asumiendo formato ISO que se puede comparar
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