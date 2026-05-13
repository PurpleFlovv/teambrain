package com.teambrain.controller;

import com.teambrain.entity.User;
import com.teambrain.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getUsers() {
        List<Map<String, Object>> users = adminService.getAllUsers().stream()
                .map(u -> Map.<String, Object>of(
                        "id", u.getId(),
                        "username", u.getUsername(),
                        "email", u.getEmail() != null ? u.getEmail() : "",
                        "enabled", u.getEnabled()))
                .toList();
        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{id}/state")
    public ResponseEntity<?> setUserState(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        adminService.setUserEnabled(id, body.get("enabled"));
        return ResponseEntity.ok(Map.of("message", "状态已更新"));
    }
}
