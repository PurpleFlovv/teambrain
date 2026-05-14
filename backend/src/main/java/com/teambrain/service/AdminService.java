package com.teambrain.service;

import com.teambrain.entity.*;
import com.teambrain.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.*;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamNodeRepository teamNodeRepository;
    private final NodeConnectionRepository connectionRepository;
    private final BrainRegionRepository regionRepository;
    private final BrainRegionService brainRegionService;
    private final RoleRepository roleRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminService(UserRepository userRepository, TeamRepository teamRepository,
                        TeamNodeRepository teamNodeRepository, NodeConnectionRepository connectionRepository,
                        BrainRegionRepository regionRepository, BrainRegionService brainRegionService,
                        RoleRepository roleRepository,
                        AuditLogRepository auditLogRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.teamNodeRepository = teamNodeRepository;
        this.connectionRepository = connectionRepository;
        this.regionRepository = regionRepository;
        this.brainRegionService = brainRegionService;
        this.roleRepository = roleRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private void log(String username, String action, String target) {
        auditLogRepository.save(new AuditLog(username, action, target));
    }

    // ---- Stats ----
    public Map<String, Long> getStats() {
        return Map.of(
            "userCount", userRepository.count(),
            "teamCount", teamRepository.count(),
            "nodeCount", teamNodeRepository.count()
        );
    }

    // ---- Users ----
    public List<Map<String, Object>> getAllUsers() {
        return userRepository.findAll().stream().map(u -> {
            Team t = teamRepository.findByUserId(u.getId()).orElse(null);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("username", u.getUsername());
            m.put("email", u.getEmail() != null ? u.getEmail() : "");
            m.put("enabled", u.getEnabled());
            m.put("roles", u.getRoles().stream().map(r -> r.getName()).toList());
            m.put("teamId", t != null ? t.getId() : null);
            m.put("teamName", t != null ? t.getTeamName() : null);
            return m;
        }).toList();
    }

    public User createUser(String username, String password, String email, List<String> roles,
                           String adminUsername) {
        if (userRepository.existsByUsername(username))
            throw new RuntimeException("用户名已存在");
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setEmail(email);
        Set<Role> roleSet = new HashSet<>();
        for (String r : roles) {
            roleRepository.findByName(r).ifPresent(roleSet::add);
        }
        user.setRoles(roleSet);
        user = userRepository.save(user);
        Team team = teamRepository.save(new Team(user.getUsername() + "的团队", "团队大脑", user));
        brainRegionService.copyTemplatesForTeam(team.getId());
        log(adminUsername, "CREATE_USER", username);
        return user;
    }

    public User updateUser(Long id, String username, String email, List<String> roles,
                           String password, String adminUsername) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("用户不存在"));
        if (username != null) user.setUsername(username);
        if (email != null) user.setEmail(email);
        if (password != null && !password.isEmpty()) user.setPassword(passwordEncoder.encode(password));
        if (roles != null && !roles.isEmpty()) {
            Set<Role> roleSet = new HashSet<>();
            for (String r : roles) roleRepository.findByName(r).ifPresent(roleSet::add);
            user.setRoles(roleSet);
        }
        userRepository.save(user);
        log(adminUsername, "UPDATE_USER", user.getUsername());
        return user;
    }

    public void deleteUser(Long id, String adminUsername) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("用户不存在"));
        String uname = user.getUsername();
        teamRepository.findByUserId(id).ifPresent(team -> {
            connectionRepository.findByTeamId(team.getId()).forEach(c -> connectionRepository.delete(c));
            teamNodeRepository.findByTeamId(team.getId()).forEach(n -> teamNodeRepository.delete(n));
            teamRepository.delete(team);
        });
        userRepository.delete(user);
        log(adminUsername, "DELETE_USER", uname);
    }

    public void setUserEnabled(Long userId, boolean enabled) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("用户不存在"));
        user.setEnabled(enabled);
        userRepository.save(user);
    }

    // ---- Teams ----
    public Team createTeam(String teamName, String description, Long userId, String adminUsername) {
        User owner = userRepository.findById(userId).orElseThrow();
        Team team = new Team(teamName, description != null ? description : "", owner);
        team = teamRepository.save(team);
        brainRegionService.copyTemplatesForTeam(team.getId());
        log(adminUsername, "CREATE_TEAM", teamName);
        return team;
    }

    public List<Map<String, Object>> getAllTeams() {
        return teamRepository.findAll().stream().map(t -> {
            List<TeamNode> nodes = teamNodeRepository.findByTeamId(t.getId());
            long memberCount = 0, projectCount = 0;
            for (TeamNode n : nodes) {
                TeamNode.NodeType nt = n.getNodeType();
                if (nt != null) {
                    if (nt == TeamNode.NodeType.MEMBER) memberCount++;
                    else if (nt == TeamNode.NodeType.PROJECT) projectCount++;
                }
            }
            return Map.<String, Object>of(
                "id", t.getId(), "teamName", t.getTeamName(),
                "description", t.getDescription() != null ? t.getDescription() : "",
                "ownerUsername", t.getUser().getUsername(),
                "memberCount", memberCount,
                "projectCount", projectCount,
                "createdAt", t.getUser().getUsername()
            );
        }).toList();
    }

    public void updateTeam(Long teamId, String teamName, String description, String adminUsername) {
        Team team = teamRepository.findById(teamId).orElseThrow(() -> new RuntimeException("团队不存在"));
        if (teamName != null) team.setTeamName(teamName);
        if (description != null) team.setDescription(description);
        teamRepository.save(team);
        log(adminUsername, "UPDATE_TEAM", team.getTeamName());
    }

    public void deleteTeam(Long teamId, String adminUsername) {
        Team team = teamRepository.findById(teamId).orElseThrow(() -> new RuntimeException("团队不存在"));
        String tname = team.getTeamName();
        connectionRepository.findByTeamId(teamId).forEach(c -> connectionRepository.delete(c));
        teamNodeRepository.findByTeamId(teamId).forEach(n -> teamNodeRepository.delete(n));
        teamRepository.delete(team);
        log(adminUsername, "DELETE_TEAM", tname);
    }

    // ---- Regions ----
    public void updateRegion(Long regionId, String name, String colorHex, String adminUsername) {
        BrainRegion region = regionRepository.findById(regionId)
            .orElseThrow(() -> new RuntimeException("脑区不存在"));
        if (name != null) region.setName(name);
        if (colorHex != null) region.setColorHex(colorHex);
        regionRepository.save(region);
        log(adminUsername, "UPDATE_REGION", region.getName());
    }

    // ---- Audit Logs ----
    public Page<AuditLog> getLogs(String action, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        if (action != null && !action.isEmpty())
            return auditLogRepository.findByAction(action, pageable);
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
    }
}
