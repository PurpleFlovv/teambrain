package com.teambrain.service;

import com.teambrain.dto.LoginRequest;
import com.teambrain.dto.LoginResponse;
import com.teambrain.dto.RegisterRequest;
import com.teambrain.entity.Role;
import com.teambrain.entity.Team;
import com.teambrain.entity.User;
import com.teambrain.repository.RoleRepository;
import com.teambrain.repository.TeamRepository;
import com.teambrain.repository.UserRepository;
import com.teambrain.util.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final TeamRepository teamRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, RoleRepository roleRepository,
                       TeamRepository teamRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.teamRepository = teamRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public LoginResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());

        Role userRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new RuntimeException("默认角色未配置"));
        user.setRoles(Set.of(userRole));
        user = userRepository.save(user);

        Team team = new Team(request.getUsername() + "的团队", "团队大脑", user);
        teamRepository.save(team);

        List<String> roles = List.of("USER");
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), roles);
        return new LoginResponse(token, user.getId(), user.getUsername(), team.getId(), roles);
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("用户名或密码错误"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("用户名或密码错误");
        }

        if (!user.getEnabled()) {
            throw new RuntimeException("账号已被禁用");
        }

        Team team = teamRepository.findByUserId(user.getId())
                .orElseGet(() -> teamRepository.save(new Team(user.getUsername() + "的团队", "团队大脑", user)));

        List<String> roles = user.getRoles().stream().map(Role::getName).toList();
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), roles);
        return new LoginResponse(token, user.getId(), user.getUsername(), team.getId(), roles);
    }
}
