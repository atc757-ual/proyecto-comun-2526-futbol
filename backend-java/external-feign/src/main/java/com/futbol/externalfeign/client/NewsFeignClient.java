package com.futbol.externalfeign.client;

import com.futbol.common.dto.ApiResult;
import com.futbol.externalfeign.dto.NewsDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@FeignClient(name = "NEWS-BRIDGE-CLIENT", url = "${corba.bridge.url:http://localhost:8089/corba-bridge/api/noticias}")
public interface NewsFeignClient {

    @GetMapping
    ApiResult<List<NewsDTO>> findAll(@RequestHeader(value = "Authorization", required = false) String auth, @RequestHeader("X-User-Role") String role);

    @GetMapping("/feed")
    ApiResult<List<NewsDTO>> getFeed(@RequestHeader(value = "Authorization", required = false) String auth);

    @GetMapping("/{id}")
    ApiResult<NewsDTO> findById(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable("id") String id);

    @PostMapping
    ApiResult<NewsDTO> create(@RequestHeader("Authorization") String auth, @RequestHeader("X-User-Role") String role, @RequestBody NewsDTO news);

    @PostMapping("/bulk")
    ApiResult<List<NewsDTO>> bulkCreate(@RequestHeader("Authorization") String auth, @RequestHeader("X-User-Role") String role, @RequestBody List<NewsDTO> newsList);

    @PutMapping("/{id}")
    ApiResult<NewsDTO> update(@RequestHeader("Authorization") String auth, @RequestHeader("X-User-Role") String role, @PathVariable("id") String id, @RequestBody NewsDTO news);

    @DeleteMapping("/{id}")
    ApiResult<Void> delete(@RequestHeader("Authorization") String auth, @RequestHeader("X-User-Role") String role, @PathVariable("id") String id);
}
