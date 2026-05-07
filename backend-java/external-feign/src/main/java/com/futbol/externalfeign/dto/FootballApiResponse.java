package com.futbol.externalfeign.dto;

import lombok.Data;
import java.util.List;

@Data
public class FootballApiResponse {
    private List<ResponseWrapper> response;

    @Data
    public static class ResponseWrapper {
        private PlayerInfo player;
    }

    @Data
    public static class PlayerInfo {
        private Long id;
        private String name;
        private String firstname;
        private String lastname;
        private Integer age;
        private Birth birth;
        private String nationality;
    }

    @Data
    public static class Birth {
        private String date;
        private String place;
        private String country;
    }
}
