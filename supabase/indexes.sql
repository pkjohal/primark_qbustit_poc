-- ============================================
-- Primark Qbust.it POC — Performance Indexes
-- Run after schema.sql
-- ============================================

CREATE INDEX idx_sessions_store   ON scan_sessions(store_id, status);
CREATE INDEX idx_sessions_user    ON scan_sessions(user_id);
CREATE INDEX idx_sessions_started ON scan_sessions(started_at);
CREATE INDEX idx_sessions_status  ON scan_sessions(status);
CREATE INDEX idx_items_session    ON scan_items(session_id);
CREATE INDEX idx_items_ean        ON scan_items(ean);
CREATE INDEX idx_audit_entity     ON audit_log(entity_type, entity_id);
CREATE INDEX idx_users_store      ON users(store_id, is_active);
