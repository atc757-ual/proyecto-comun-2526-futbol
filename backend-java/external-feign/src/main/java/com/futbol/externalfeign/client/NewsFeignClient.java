package com.futbol.externalfeign.client;

import com.futbol.externalfeign.dto.ApiResult;
import com.futbol.externalfeign.dto.NewsDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@FeignClient(name = "NEWS-BRIDGE-CLIENT", url = "${corba.bridge.url:http://localhost:8089/corba-bridge/api/noticias}")
public interface NewsFeignClient {

    @GetMapping
    ApiResult<List<NewsDTO>> findAll(@RequestHeader("Authorization") String auth, @RequestHeader("X-User-Role") String role);

    @GetMapping("/feed")
    ApiResult<List<NewsDTO>> getFeed();

    @GetMapping("/{id}")
    ApiResult<NewsDTO> findById(@PathVariable("id") String id);

    @PostMapping
    ApiResult<NewsDTO> create(@RequestHeader("Authorization") String auth, @RequestHeader("X-User-Role") String role, @RequestBody NewsDTO news);

    @PutMapping("/{id}")
    ApiResult<NewsDTO> update(@RequestHeader("Authorization") String auth, @RequestHeader("X-User-Role") String role, @PathVariable("id") String id, @RequestBody NewsDTO news);

    @DeleteMapping("/{id}")
    ApiResult<Void> delete(@RequestHeader("Authorization") String auth, @RequestHeader("X-User-Role") String role, @PathVariable("id") String id);
}
