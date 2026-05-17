package com.futbol.client.comment.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResult<T> {

    private Result result;
    private T data;

    public ApiResult(String code, String detail, T data) {
        boolean isSuccess = code.length() == 3 && code.startsWith("2");
        String finalDetail = "200".equals(code) ? "Procesamiento concluído exitosamente" : detail;
        this.result = new Result(
            UUID.randomUUID().toString(),
            code, 
            isSuccess ? "OK" : "NOK", 
            finalDetail, 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS"))
        );
        this.data = data;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonPropertyOrder({ "transactionId", "code", "description", "descriptionDetail", "responseTimestamp" })
    public static class Result {
        private String transactionId;
        private String code;
        private String description;
        private String descriptionDetail;
        private String responseTimestamp;
    }
}
