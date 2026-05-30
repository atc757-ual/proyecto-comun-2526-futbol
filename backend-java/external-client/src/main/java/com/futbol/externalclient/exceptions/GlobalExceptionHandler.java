package com.futbol.externalclient.exceptions;

import com.futbol.common.dto.ApiResult;
import feign.FeignException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResult<Object>> handleAllExceptions(Exception ex) {
        if (ex instanceof FeignException.Unauthorized) {
            ApiResult<Object> response = new ApiResult<>(
                String.valueOf(HttpStatus.UNAUTHORIZED.value()),
                "No autorizado",
                null
            );
            return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
        }

        if (ex instanceof FeignException.Forbidden) {
            ApiResult<Object> response = new ApiResult<>(
                String.valueOf(HttpStatus.FORBIDDEN.value()),
                "Permisos insuficientes",
                null
            );
            return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
        }

        if (ex instanceof FeignException feignEx) {
            int status = feignEx.status();
            if (status == 404) {
                return new ResponseEntity<>(
                    new ApiResult<>(String.valueOf(HttpStatus.NOT_FOUND.value()), "Recurso no encontrado", null),
                    HttpStatus.NOT_FOUND);
            }
            if (status == 403) {
                return new ResponseEntity<>(
                    new ApiResult<>(String.valueOf(HttpStatus.FORBIDDEN.value()), "Permisos insuficientes", null),
                    HttpStatus.FORBIDDEN);
            }
            if (status == 401) {
                return new ResponseEntity<>(
                    new ApiResult<>(String.valueOf(HttpStatus.UNAUTHORIZED.value()), "No autorizado", null),
                    HttpStatus.UNAUTHORIZED);
            }
        }

        ApiResult<Object> resp = new ApiResult<>(
            String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value()),
            "Error interno procesando la solicitud",
            null
        );
        return new ResponseEntity<>(resp, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
