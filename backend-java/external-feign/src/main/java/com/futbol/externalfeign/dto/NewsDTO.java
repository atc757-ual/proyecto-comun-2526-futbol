package com.futbol.externalfeign.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsDTO {
    private String id;
    private String title;
    private String author;
    private String content;
    private String summary;
    private String imageUrl;
    private String category;
    private List<String> tags;
    private String publishedDate; // Formato DD/MM/YYYY o ISO
    private String status;
    private Boolean isFeatured;
    private Boolean isActive;
}
