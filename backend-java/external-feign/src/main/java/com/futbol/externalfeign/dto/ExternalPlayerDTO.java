package com.futbol.externalfeign.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ExternalPlayerDTO {
    private Long externalId;
    private String name;
    private String firstname;
    private String lastname;
    private Integer age;
    private String birthDate;
    private String nationality;
    private String photo;
    private String position;
}
