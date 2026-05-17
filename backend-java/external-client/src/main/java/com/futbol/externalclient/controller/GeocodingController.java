package com.futbol.externalclient.controller;

import com.futbol.common.dto.ApiResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/geo")
@Tag(name = "Geocoding API", description = "Servicio de geocoding inverso usando Nominatim (OSM)")
public class GeocodingController {

    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping
    @Operation(summary = "Geocoding Inverso", description = "Obtiene una dirección legible a partir de latitud y longitud")
    public ApiResult<Map<String, Object>> reverseGeocode(
            @RequestParam Double lat,
            @RequestParam Double lng) {
        
        try {
            String url = String.format("https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=%s&lon=%s", lat, lng);
            
            // Usamos un Map genérico para recibir la respuesta de Nominatim
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null && response.containsKey("display_name")) {
                @SuppressWarnings("unchecked")
                Map<String, String> addr = (Map<String, String>) response.get("address");
                
                String street = addr.getOrDefault("road", addr.getOrDefault("pedestrian", addr.getOrDefault("path", "")));
                String houseNumber = addr.getOrDefault("house_number", "");
                String postCode = addr.getOrDefault("postcode", "");
                String state = addr.getOrDefault("state", addr.getOrDefault("province", ""));

                List<String> parts = new ArrayList<>();
                if (!street.isEmpty()) parts.add(street);
                if (!houseNumber.isEmpty()) parts.add(houseNumber);
                if (!postCode.isEmpty()) parts.add(postCode);
                if (!state.isEmpty()) parts.add(state);

                String addressPart = String.join(", ", parts);
                if (addressPart.isEmpty()) {
                    String displayName = (String) response.get("display_name");
                    String[] dispParts = displayName.split(",");
                    addressPart = dispParts.length >= 3 
                        ? dispParts[0] + ", " + dispParts[1] + ", " + dispParts[2]
                        : displayName;
                }

                return ApiResult.success("Dirección obtenida", Map.of(
                    "displayAddress", addressPart,
                    "raw", response
                ));
            }

            return ApiResult.error("404", "No se encontró una dirección para estas coordenadas");

        } catch (Exception e) {
            return ApiResult.error("500", "Error al consultar servicio de geocoding: " + e.getMessage());
        }
    }
}
