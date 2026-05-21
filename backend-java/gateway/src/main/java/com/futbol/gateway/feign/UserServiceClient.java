package com.futbol.gateway.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@FeignClient(name = "user-client", url = "http://football-user-client:8083")
public interface UserServiceClient {

    @PostMapping("/api/users/sync")
    Map<String, Object> syncUser(@RequestBody Map<String, Object> body);

    @GetMapping("/api/users/firebase/{firebaseUid}")
    Map<String, Object> getUserByFirebaseUid(@PathVariable("firebaseUid") String firebaseUid);

    @GetMapping("/api/users/email/{email}")
    Map<String, Object> getUserByEmail(@PathVariable("email") String email);

    @GetMapping("/api/users/search")
    Map<String, Object> searchUsers(@RequestParam(required = false) String email);

    @PostMapping("/api/users/make-admin")
    Map<String, Object> makeAdmin(@RequestBody Map<String, String> body);

    @PostMapping("/api/users/remove-admin")
    Map<String, Object> removeAdmin(@RequestBody Map<String, String> body);

    @PostMapping("/api/users/toggle-status")
    Map<String, Object> toggleStatus(@RequestBody Map<String, Object> body);
}
