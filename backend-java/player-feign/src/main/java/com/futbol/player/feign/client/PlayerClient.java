package com.futbol.player.feign.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import com.futbol.player.feign.service.PlayerFallbackFactory;
import com.futbol.player.feign.model.PlayerDTO;
import com.futbol.player.feign.dto.ApiResult;
import java.util.List;

@FeignClient(name="PLAYER-CLIENT", fallbackFactory = PlayerFallbackFactory.class)
public interface PlayerClient {

    @GetMapping("/api/players")
    ApiResult<List<PlayerDTO>> getAllPlayers(
        @RequestParam(value = "userId", required = false) String userId,
        @RequestParam(value = "name", required = false) String name,
        @RequestParam(value = "team", required = false) String team
    );

    @GetMapping("/api/players/{id}")
    ApiResult<PlayerDTO> getPlayerById(@PathVariable("id") Long id);

    @PostMapping("/api/players")
    ApiResult<PlayerDTO> createPlayer(@RequestBody PlayerDTO player);

    @PutMapping("/api/players")
    ApiResult<PlayerDTO> updatePlayer(@RequestBody PlayerDTO player);

    @DeleteMapping("/api/players/{id}")
    ApiResult<Void> deletePlayer(@PathVariable("id") Long id);
}
