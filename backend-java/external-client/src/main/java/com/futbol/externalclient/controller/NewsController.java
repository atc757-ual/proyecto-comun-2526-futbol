package com.futbol.externalclient.controller;

import com.futbol.common.dto.ApiResult;
import com.futbol.externalfeign.client.NewsFeignClient;
import com.futbol.externalfeign.dto.NewsDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/news")
@Tag(name = "News API", description = "Gestión de noticias a través del Bridge CORBA")
public class NewsController {

    private static final Pattern ISO_DATE_PATTERN = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}$");
    private static final Pattern CORBA_DATE_PATTERN = Pattern.compile("^\\d{2}/\\d{2}/\\d{4}$");

    private final NewsFeignClient newsClient;

    public NewsController(NewsFeignClient newsClient) {
        this.newsClient = newsClient;
    }

    @GetMapping
    @Operation(summary = "Obtener noticias (feed público o todas si admin)")
    public ApiResult<List<NewsDTO>> getNews(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestHeader(value = "X-User-Role", defaultValue = "USER") String role,
            @RequestParam(required = false, defaultValue = "false") Boolean all,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {
        if (Boolean.TRUE.equals(all) && "ADMIN".equalsIgnoreCase(role)) {
            return newsClient.findAll(auth, role, page, limit);
        } else {
            return newsClient.getFeed(auth, page, limit);
        }
    }

    @GetMapping("/feed")
    @Operation(summary = "Obtener feed de noticias activas")
    public ApiResult<List<NewsDTO>> getFeed(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {
        return newsClient.getFeed(auth, page, limit);
    }

    @GetMapping("/featured")
    @Operation(summary = "Obtener noticias destacadas")
    public ApiResult<List<NewsDTO>> getFeatured(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {
        return newsClient.getFeatured(auth, page, limit);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener noticia por ID")
    public ApiResult<NewsDTO> getNewsById(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable String id) {
        return newsClient.findById(auth, id);
    }

    @PostMapping
    @Operation(summary = "Crear noticia (Admin)")
    public ApiResult<NewsDTO> createNews(
            @RequestHeader("Authorization") String auth,
            @RequestHeader("X-User-Role") String role,
            @RequestBody NewsDTO news) {
        normalizeDate(news);
        return newsClient.create(auth, role, news);
    }

    @PostMapping("/bulk")
    @Operation(summary = "Carga masiva de noticias (Admin)")
    public ApiResult<List<NewsDTO>> bulkCreateNews(
            @RequestHeader("Authorization") String auth,
            @RequestHeader("X-User-Role") String role,
            @RequestBody List<NewsDTO> newsList) {
        if (newsList != null) {
            newsList.forEach(this::normalizeDate);
        }
        return newsClient.bulkCreate(auth, role, newsList);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar noticia (Admin)")
    public ApiResult<NewsDTO> updateNews(
            @RequestHeader("Authorization") String auth,
            @RequestHeader("X-User-Role") String role,
            @PathVariable String id,
            @RequestBody NewsDTO news) {
        normalizeDate(news);
        return newsClient.update(auth, role, id, news);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar noticia (Admin)")
    public ApiResult<Void> deleteNews(
            @RequestHeader("Authorization") String auth,
            @RequestHeader("X-User-Role") String role,
            @PathVariable String id) {
        return newsClient.delete(auth, role, id);
    }

    private void normalizeDate(NewsDTO news) {
        if (news == null) return;
        news.setDate(convertToCorbaDate(news.getDate()));
        news.setExpiryDate(convertToCorbaDate(news.getExpiryDate()));
    }

    private String convertToCorbaDate(String raw) {
        if (raw == null || raw.trim().isEmpty()) return raw;
        String trimmed = raw.trim();
        if (CORBA_DATE_PATTERN.matcher(trimmed).matches()) return trimmed;
        String dateOnly = trimmed.contains("T") ? trimmed.split("T")[0] : trimmed;
        if (ISO_DATE_PATTERN.matcher(dateOnly).matches()) {
            String[] parts = dateOnly.split("-");
            return parts[2] + "/" + parts[1] + "/" + parts[0];
        }
        return trimmed;
    }
}
