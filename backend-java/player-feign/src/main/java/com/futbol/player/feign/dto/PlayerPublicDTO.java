package com.futbol.player.feign.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PlayerPublicDTO {
    @JsonProperty("_id")
    private Long id;
    private String name;
    private String photo;
}
