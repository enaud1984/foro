package it.foro.platform.api;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@RestControllerAdvice
public class ApiExceptionHandler {
  record ErrorBody(String code,String message,List<Map<String,String>> fieldErrors,String correlationId,boolean retryable){}
  @ExceptionHandler(ResponseStatusException.class)
  ResponseEntity<ErrorBody> status(ResponseStatusException e,HttpServletRequest r){
    var code=e.getReason()==null?"REQUEST_FAILED":e.getReason();
    return ResponseEntity.status(e.getStatusCode()).body(new ErrorBody(code,code,List.of(),correlation(r),false));
  }
  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ErrorBody> validation(MethodArgumentNotValidException e,HttpServletRequest r){
    var fields=e.getBindingResult().getFieldErrors().stream().map(x->Map.of("field",x.getField(),"code",Objects.toString(x.getCode(),"INVALID"))).toList();
    return ResponseEntity.badRequest().body(new ErrorBody("VALIDATION_ERROR","Dati non validi",fields,correlation(r),false));
  }
  private String correlation(HttpServletRequest r){return Optional.ofNullable(r.getHeader("X-Correlation-ID")).orElse(UUID.randomUUID().toString());}
}
