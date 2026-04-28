package com.futbol.client.player.exceptions;

import com.futbol.client.player.dto.ApiResult;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.stream.Collectors;

@RestControllerAdvice
public class ControllerExceptionHandler {

    // Error 404: Resource not found (Custom exception)
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiResult<Object>> handleNotFound(NotFoundException ex) {
        ApiResult<Object> resp = new ApiResult<>(
            String.valueOf(HttpStatus.NOT_FOUND.value()), 
            ex.getMessage(),
            null
        );
        return new ResponseEntity<>(resp, HttpStatus.NOT_FOUND);
    }

    // Error 409: Conflict (Database integrity violation like Unique or Primary Key)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResult<Object>> handleConflict(DataIntegrityViolationException ex) {
        ApiResult<Object> resp = new ApiResult<>(
            String.valueOf(HttpStatus.CONFLICT.value()), 
            "Database integrity violation: Record might already exist or violates constraints.",
            null
        );
        return new ResponseEntity<>(resp, HttpStatus.CONFLICT);
    }

    // Error 400: Validation Errors (@Valid)
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

    // Error 400: Type mismatch (e.g., sending text instead of ID number)
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResult<Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        ApiResult<Object> resp = new ApiResult<>(
            String.valueOf(HttpStatus.BAD_REQUEST.value()), 
            "Parameter '" + ex.getName() + "' should be of type " + (ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown"),
            null
        );
        return new ResponseEntity<>(resp, HttpStatus.BAD_REQUEST);
    }

    // Error 405: Method Not Allowed
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResult<Object>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        ApiResult<Object> resp = new ApiResult<>(
            String.valueOf(HttpStatus.METHOD_NOT_ALLOWED.value()), 
            "Method '" + ex.getMethod() + "' is not supported for this endpoint",
            null
        );
        return new ResponseEntity<>(resp, HttpStatus.METHOD_NOT_ALLOWED);
    }

    // Error 415: Unsupported Media Type
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiResult<Object>> handleMediaTypeNotSupported(HttpMediaTypeNotSupportedException ex) {
        ApiResult<Object> resp = new ApiResult<>(
            String.valueOf(HttpStatus.UNSUPPORTED_MEDIA_TYPE.value()), 
            "Content type '" + (ex.getContentType() != null ? ex.getContentType().toString() : "unknown") + "' is not supported",
            null
        );
        return new ResponseEntity<>(resp, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
    }

    // Error 500: Catch-all for any other unexpected error
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResult<Object>> handleGlobalException(Exception ex) {
        ApiResult<Object> resp = new ApiResult<>(
            String.valueOf(HttpStatus.INTERNAL_SERVER_ERROR.value()), 
            "An unexpected error occurred: " + ex.getMessage(),
            null
        );
        return new ResponseEntity<>(resp, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
