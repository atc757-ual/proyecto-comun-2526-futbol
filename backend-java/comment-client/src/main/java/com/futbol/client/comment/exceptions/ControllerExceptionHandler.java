package com.futbol.client.comment.exceptions;

import com.futbol.client.comment.dto.ApiResult;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.stream.Collectors;

@RestControllerAdvice
public class ControllerExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiResult<Object>> handleNotFound(NotFoundException ex) {
        ApiResult<Object> resp = new ApiResult<>(
            String.valueOf(HttpStatus.NOT_FOUND.value()), 
            ex.getMessage(),
            null
        );
        return new ResponseEntity<>(resp, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResult<Object>> handleConflict(DataIntegrityViolationException ex) {
        ApiResult<Object> resp = new ApiResult<>(
            String.valueOf(HttpStatus.CONFLICT.value()), 
            "Database integrity violation: Possible duplicate or constraint error.",
            null
        );
        return new ResponseEntity<>(resp, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResult<Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        String errors = ex.getBindingResult().getFieldErrors()
                .stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
        
        ApiResult<Object> resp = new ApiResult<>(
            String.valueOf(HttpStatus.BAD_REQUEST.value()), 
            errors,
            null
        );
        return new ResponseEntity<>(resp, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResult<Object>> handleGlobalException(Exception ex) {
        ApiResult<Object> resp = new ApiResult<>(
            String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value()), 
            ex.getMessage(),
            null
        );
        return new ResponseEntity<>(resp, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
