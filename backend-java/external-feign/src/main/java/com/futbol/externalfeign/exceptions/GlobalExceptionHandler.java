package com.futbol.externalfeign.exceptions;

import com.futbol.externalfeign.dto.ApiResult;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResult<Object>> handleAllExceptions(Exception ex) {
        ApiResult<Object> resp = new ApiResult<>(
            String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value()), 
            "Error en el proxi External Feign: " + ex.getMessage(),
            null
        );
        return new ResponseEntity<>(resp, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
