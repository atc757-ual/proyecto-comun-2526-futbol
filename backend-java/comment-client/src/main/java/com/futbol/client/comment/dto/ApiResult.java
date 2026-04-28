package com.futbol.client.comment.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResult<T> {

    private Result result;
    private T data;

    public ApiResult() {}

    public ApiResult(String code, String detail, T data) {
        boolean isSuccess = code.length() == 3 && code.startsWith("2");
        this.result = new Result(
            UUID.randomUUID().toString(),
            code, 
            isSuccess ? "OK" : "NOK", 
            detail, 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS"))
        );
        this.data = data;
    }

    @JsonPropertyOrder({ "transactionId", "code", "description", "descriptionDetail", "responseTimestamp" })
    public static class Result {
        private String transactionId;
        private String code;
        private String description;
        private String descriptionDetail;
        private String responseTimestamp;

        public Result() {}

        public Result(String transactionId, String code, String description, String descriptionDetail, String responseTimestamp) {
            this.transactionId = transactionId;
            this.code = code;
            this.description = description;
            this.descriptionDetail = descriptionDetail;
            this.responseTimestamp = responseTimestamp;
        }

        public String getTransactionId() { return transactionId; }
        public String getCode() { return code; }
        public String getDescription() { return description; }
        public String getDescriptionDetail() { return descriptionDetail; }
        public String getResponseTimestamp() { return responseTimestamp; }
    }

    public Result getResult() { return result; }
    public T getData() { return data; }
}
