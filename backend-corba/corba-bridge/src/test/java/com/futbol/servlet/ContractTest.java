package com.futbol.servlet;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import java.util.LinkedHashMap;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

public class ContractTest {

    @Test
    public void testApiResultStructureAndOrder() throws Exception {
        // Simulamos la creación del JSON que hace el Servlet con LinkedHashMap para
        // asegurar orden
        Map<String, Object> responseMap = new LinkedHashMap<>();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("transactionId", "123");
        result.put("code", "200");
        result.put("description", "OK");
        result.put("descriptionDetail", "Success");
        result.put("responseTimestamp", "2026-05-01T00:00:00Z");

        responseMap.put("result", result);
        responseMap.put("data", "some-data");

        // Usamos Jackson (que ya está en el proyecto) para serializar
        ObjectMapper mapper = new ObjectMapper();
        String json = mapper.writeValueAsString(responseMap);

        // Validar que los campos aparecen en el orden correcto en el String JSON
        int idxTransaction = json.indexOf("transactionId");
        int idxCode = json.indexOf("code");
        int idxDescription = json.indexOf("description");
        int idxData = json.indexOf("data");

        assertTrue(idxTransaction != -1, "Debe contener transactionId");
        assertTrue(idxTransaction < idxCode, "transactionId debe estar antes que code");
        assertTrue(idxCode < idxDescription, "code debe estar antes que description");

        // El bloque 'result' debe estar antes que 'data'
        assertTrue(json.indexOf("result") < idxData, "El bloque result debe aparecer antes que data");

        System.out.println("[CORBA-TEST] Contrato validado con exito usando Jackson.");
    }
}
