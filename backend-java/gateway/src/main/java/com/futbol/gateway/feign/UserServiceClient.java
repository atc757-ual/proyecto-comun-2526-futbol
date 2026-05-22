package com.futbol.gateway.feign;

import com.futbol.common.dto.ApiResult;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@FeignClient(name = "user-client", url = "http://football-user-client:8083")
public interface UserServiceClient {

    @PostMapping("/api/users/sync")
    ApiResult<Object> syncUser(@RequestBody Map<String, Object> body);

    @GetMapping("/api/users/firebase/{firebaseUid}")
    ApiResult<Object> getUserByFirebaseUid(@PathVariable("firebaseUid") String firebaseUid);

    @GetMapping("/api/users/email/{email}")
    ApiResult<Object> getUserByEmail(@PathVariable("email") String email);

    @GetMapping("/api/users/search")
    ApiResult<Object> searchUsers(@RequestParam(value = "email", required = false) String email);

    @PostMapping("/api/users/make-admin")
    ApiResult<Object> makeAdmin(@RequestBody Map<String, String> body);

    @PostMapping("/api/users/remove-admin")
    ApiResult<Object> removeAdmin(@RequestBody Map<String, String> body);

    @PostMapping("/api/users/toggle-status")
    ApiResult<Object> toggleStatus(@RequestBody Map<String, Object> body);
}
