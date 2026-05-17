package com.futbol.client.player.domain;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SocialMedia {
    private String facebook;
    private String instagram;
    private String twitter;
    private String website;
}
