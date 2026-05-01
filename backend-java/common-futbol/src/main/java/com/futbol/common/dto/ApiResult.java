package com.futbol.common.dto;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import java.io.Serializable;

@JsonPropertyOrder({ "result", "data" })
public class ApiResult<T> implements Serializable {
    private Result result;
    private T data;

    public ApiResult() {}

    public ApiResult(Result result, T data) {
        this.result = result;
        this.data = data;
    }

    public static <T> ApiResult<T> success(String detail, T data) {
        return new ApiResult<>(new Result("200", "OK", detail), data);
    }

    public static <T> ApiResult<T> error(String code, String detail) {
        return new ApiResult<>(new Result(code, "NOK", detail), null);
    }

    // Getters y Setters
    public Result getResult() { return result; }
    public void setResult(Result result) { this.result = result; }
    public T getData() { return data; }
    public void setData(T data) { this.data = data; }
}
