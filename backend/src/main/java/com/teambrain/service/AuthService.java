package com.teambrain.service;

import com.teambrain.dto.LoginRequest;
import com.teambrain.dto.LoginResponse;
import com.teambrain.dto.RegisterRequest;
import com.teambrain.entity.Role;
import com.teambrain.entity.Team;
import com.teambrain.entity.User;
import com.teambrain.entity.UserTeam;
import com.teambrain.repository.RoleRepository;
import com.teambrain.repository.TeamRepository;
import com.teambrain.repository.UserRepository;
import com.teambrain.repository.UserTeamRepository;
import com.teambrain.util.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final TeamRepository teamRepository;
    private final UserTeamRepository userTeamRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, RoleRepository roleRepository,
                       TeamRepository teamRepository, UserTeamRepository userTeamRepository,
                       PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.teamRepository = teamRepository;
        this.userTeamRepository = userTeamRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public LoginResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        Role userRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new RuntimeException("默认角色未配置"));
        user.setRoles(Set.of(userRole));
        user = userRepository.save(user);

        // Auto-join team 影视飓风 (teamId=1)
        try { userTeamRepository.save(new UserTeam(user.getId(), 1L)); } catch (Exception ignored) {}

        List<String> roles = List.of("USER");
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), roles);
        return new LoginResponse(token, user.getId(), user.getUsername(), null, List.of(), roles);
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("用户名或密码错误"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("用户名或密码错误");
        }

        if (!user.getEnabled()) {
            throw new RuntimeException("账号已被禁用");
        }

        Long ownedTeamId = teamRepository.findByUserId(user.getId())
                .map(Team::getId).orElse(null);

        List<Long> teamIds = new java.util.ArrayList<>(userTeamRepository.findByUserId(user.getId())
                .stream().map(UserTeam::getTeamId).toList());
        // Ensure owned team is first in the list
        if (ownedTeamId != null && !teamIds.contains(ownedTeamId)) {
            teamIds.add(0, ownedTeamId);
        }

        List<String> roles = user.getRoles().stream().map(Role::getName).toList();
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), roles);
        return new LoginResponse(token, user.getId(), user.getUsername(), ownedTeamId, teamIds, roles);
    }
}
