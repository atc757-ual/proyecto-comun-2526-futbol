package com.futbol.client.player.exceptions;

import com.futbol.client.player.dto.ErrorResponse;
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
    public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException ex) {
        ErrorResponse resp = new ErrorResponse(
            HttpStatus.NOT_FOUND.value(), 
            "Not Found", 
            ex.getMessage()
        );
        return new ResponseEntity<>(resp, HttpStatus.NOT_FOUND);
    }

    // Error 409: Conflict (Database integrity violation like Unique or Primary Key)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleConflict(DataIntegrityViolationException ex) {
        ErrorResponse resp = new ErrorResponse(
            HttpStatus.CONFLICT.value(), 
            "Conflict", 
            "Database integrity violation: Record might already exist or violates constraints."
        );
        return new ResponseEntity<>(resp, HttpStatus.CONFLICT);
    }

    // Error 400: Validation Errors (@Valid)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        String errors = ex.getBindingResult().getFieldErrors()
                .stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
        
        ErrorResponse resp = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(), 
            "Validation Failed", 
            errors
        );
        return new ResponseEntity<>(resp, HttpStatus.BAD_REQUEST);
    }

    // Error 400: Type mismatch (e.g., sending text instead of ID number)
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        ErrorResponse resp = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(), 
            "Type Mismatch", 
            "Parameter '" + ex.getName() + "' should be of type " + ex.getRequiredType().getSimpleName()
        );
        return new ResponseEntity<>(resp, HttpStatus.BAD_REQUEST);
    }

    // Error 405: Method Not Allowed
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        ErrorResponse resp = new ErrorResponse(
            HttpStatus.METHOD_NOT_ALLOWED.value(), 
            "Method Not Allowed", 
            "Method '" + ex.getMethod() + "' is not supported for this endpoint"
        );
        return new ResponseEntity<>(resp, HttpStatus.METHOD_NOT_ALLOWED);
    }

    // Error 415: Unsupported Media Type
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMediaTypeNotSupported(HttpMediaTypeNotSupportedException ex) {
        ErrorResponse resp = new ErrorResponse(
            HttpStatus.UNSUPPORTED_MEDIA_TYPE.value(), 
            "Unsupported Media Type", 
            "Content type '" + ex.getContentType() + "' is not supported"
        );
        return new ResponseEntity<>(resp, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
    }

    // Error 500: Catch-all for any other unexpected error
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(Exception ex) {
        ErrorResponse resp = new ErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(), 
            "Internal Server Error", 
            "An unexpected error occurred: " + ex.getMessage()
        );
        return new ResponseEntity<>(resp, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
