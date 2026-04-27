package com.futbol.client.player.dto;

import java.util.UUID;

public class ApiResult<T> {
    private String code;
    private String description;
    private String detail;
    private String transactionId;
    private T data;

    public ApiResult() {
        this.transactionId = UUID.randomUUID().toString();
    }

    public ApiResult(String code, String description, T data) {
        this();
        this.code = code;
        this.description = description;
        this.data = data;
    }

    public ApiResult(String code, String description, String detail) {
        this();
        this.code = code;
        this.description = description;
        this.detail = detail;
    }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public T getData() { return data; }
    public void setData(T data) { this.data = data; }
}
