package com.teambrain.config;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(1) // After data.sql, before MockDataSeeder: sync sequences so seed inserts don't collide with data.sql's explicit ids
public class SequenceFixer implements CommandLineRunner {

    @PersistenceContext
    private EntityManager em;

    @Override
    @Transactional
    public void run(String... args) {
        String[] tables = {"sys_user", "sys_role", "team",
            "team_node", "brain_region", "node_connection",
            "connection_type", "audit_log", "brain_point"};
        for (String table : tables) {
            try {
                Query q = em.createNativeQuery(
                    "SELECT setval(pg_get_serial_sequence(:tbl, 'id'), COALESCE((SELECT MAX(id) FROM " + table + "), 1))");
                q.setParameter("tbl", table);
                q.getSingleResult();
            } catch (Exception ignored) {
            }
        }
    }
}
