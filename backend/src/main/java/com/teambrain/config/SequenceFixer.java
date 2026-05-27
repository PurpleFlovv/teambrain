package com.teambrain.config;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class SequenceFixer {

    @PersistenceContext
    private EntityManager em;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void fixSequences() {
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
