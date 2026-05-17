package com.futbol.common.dto;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import java.time.Instant;
import java.io.Serializable;
import java.util.UUID;

@JsonPropertyOrder({ "transactionId", "code", "description", "descriptionDetail", "responseTimestamp" })
public class Result implements Serializable {
    private String transactionId;
    private String code;
    private String description;
    private String descriptionDetail;
    private String responseTimestamp;

    public Result() {
        this.transactionId = UUID.randomUUID().toString();
        this.responseTimestamp = Instant.now().toString();
    }

    public Result(String code, String description, String descriptionDetail) {
        this();
        this.code = code;
        this.description = description;
        this.descriptionDetail = descriptionDetail;
    }

    // Getters y Setters
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getDescriptionDetail() { return descriptionDetail; }
    public void setDescriptionDetail(String descriptionDetail) { this.descriptionDetail = descriptionDetail; }
    public String getResponseTimestamp() { return responseTimestamp; }
    public void setResponseTimestamp(String responseTimestamp) { this.responseTimestamp = responseTimestamp; }
}
