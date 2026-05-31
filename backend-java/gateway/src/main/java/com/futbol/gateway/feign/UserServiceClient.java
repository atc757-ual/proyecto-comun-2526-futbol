package com.futbol.gateway.feign;

import com.futbol.common.dto.ApiResult;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@FeignClient(name = "user-client", url = "http://football-user-client:8083")
public interface UserServiceClient {

    @PostMapping("/api/users/sync")
    ApiResult<Object> syncUser(
        @RequestHeader("X-Gateway-Validated") String validated,
        @RequestBody Map<String, Object> body);

    @GetMapping("/api/users/firebase/{firebaseUid}")
    ApiResult<Object> getUserByFirebaseUid(
        @RequestHeader("X-Gateway-Validated") String validated,
        @PathVariable("firebaseUid") String firebaseUid);

    @GetMapping("/api/users/email/{email}")
    ApiResult<Object> getUserByEmail(
        @RequestHeader("X-Gateway-Validated") String validated,
        @PathVariable("email") String email);

    @GetMapping("/api/users/search")
    ApiResult<Object> searchUsers(
        @RequestHeader("X-Gateway-Validated") String validated,
        @RequestParam(value = "email", required = false) String email);

    @PostMapping("/api/users/make-admin")
    ApiResult<Object> makeAdmin(
        @RequestHeader("X-Gateway-Validated") String validated,
        @RequestBody Map<String, String> body);

    @PostMapping("/api/users/remove-admin")
    ApiResult<Object> removeAdmin(
        @RequestHeader("X-Gateway-Validated") String validated,
        @RequestBody Map<String, String> body);

    @PostMapping("/api/users/toggle-status")
    ApiResult<Object> toggleStatus(
        @RequestHeader("X-Gateway-Validated") String validated,
        @RequestBody Map<String, Object> body);
}
