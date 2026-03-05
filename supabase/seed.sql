-- ============================================
-- Primark Qbust.it POC — Seed Data
-- Run after schema.sql and indexes.sql
-- Includes sample sessions so Reports dashboard
-- is populated on first run for immediate testing.
-- ============================================

-- ===== Stores =====
INSERT INTO stores (id, name, store_code, region) VALUES
('a0000001-0000-0000-0000-000000000001', 'Manchester Arndale',   'MAN01', 'North West'),
('a0000001-0000-0000-0000-000000000002', 'Birmingham Primark',   'BHM01', 'West Midlands'),
('a0000001-0000-0000-0000-000000000003', 'London Oxford Street', 'LON01', 'London'),
('a0000001-0000-0000-0000-000000000004', 'Leeds White Rose',     'LDS01', 'Yorkshire'),
('a0000001-0000-0000-0000-000000000005', 'Dublin Mary Street',   'DUB01', 'Ireland');

-- ===== Users =====
-- Default logins:
-- Sarah K  | Manchester Arndale  | floor_colleague | PIN: 1234
-- Tom B    | Manchester Arndale  | store_manager   | PIN: 5678
-- Amy L    | Birmingham Primark  | floor_colleague | PIN: 1234
-- James R  | Birmingham Primark  | store_manager   | PIN: 5678
-- Dan M    | London Oxford St    | admin           | PIN: 4567
INSERT INTO users (id, name, email, pin, store_id, role) VALUES
('d0000001-0000-0000-0000-000000000001', 'Sarah K', 'sarah.k@primark.com', '1234',
  'a0000001-0000-0000-0000-000000000001', 'floor_colleague'),
('d0000001-0000-0000-0000-000000000002', 'Tom B',   'tom.b@primark.com',   '5678',
  'a0000001-0000-0000-0000-000000000001', 'store_manager'),
('d0000001-0000-0000-0000-000000000003', 'Amy L',   'amy.l@primark.com',   '1234',
  'a0000001-0000-0000-0000-000000000002', 'floor_colleague'),
('d0000001-0000-0000-0000-000000000004', 'James R', 'james.r@primark.com', '5678',
  'a0000001-0000-0000-0000-000000000002', 'store_manager'),
('d0000001-0000-0000-0000-000000000005', 'Dan M',   'dan.m@primark.com',   '4567',
  'a0000001-0000-0000-0000-000000000003', 'admin');

-- ===== Seed Sessions (for report testing) =====
-- EANs below are valid EAN-13 codes (check digits verified).
INSERT INTO scan_sessions
  (id, session_number, user_id, store_id, item_count, qr_data, status, started_at, completed_at)
VALUES
('e0000001-0000-0000-0000-000000000001', 'QB-20260301-0001',
  'd0000001-0000-0000-0000-000000000001',
  'a0000001-0000-0000-0000-000000000001',
  5, 'LIST_4006381333931_0011200296908_8710447438268_5000159484428_4003994155486',
  'completed', now() - interval '3 days', now() - interval '3 days' + interval '4 minutes'),

('e0000001-0000-0000-0000-000000000002', 'QB-20260301-0002',
  'd0000001-0000-0000-0000-000000000001',
  'a0000001-0000-0000-0000-000000000001',
  3, 'LIST_4006381333931_5000159484428_8710447438268',
  'completed', now() - interval '3 days' + interval '30 minutes',
  now() - interval '3 days' + interval '36 minutes'),

('e0000001-0000-0000-0000-000000000003', 'QB-20260302-0001',
  'd0000001-0000-0000-0000-000000000002',
  'a0000001-0000-0000-0000-000000000001',
  3, 'LIST_4006381333931_4003994155486_5000159484428',
  'completed', now() - interval '2 days', now() - interval '2 days' + interval '2 minutes'),

('e0000001-0000-0000-0000-000000000004', 'QB-20260302-0002',
  'd0000001-0000-0000-0000-000000000003',
  'a0000001-0000-0000-0000-000000000002',
  7, 'LIST_4006381333931_0011200296908_8710447438268_5000159484428_4003994155486_4006381333931_0011200296908',
  'completed', now() - interval '2 days' + interval '1 hour',
  now() - interval '2 days' + interval '1 hour 8 minutes'),

('e0000001-0000-0000-0000-000000000005', 'QB-20260303-0001',
  'd0000001-0000-0000-0000-000000000001',
  'a0000001-0000-0000-0000-000000000001',
  6, 'LIST_5000159484428_5000159484428_4003994155486_4003994155486_8710447438268_0011200296908',
  'completed', now() - interval '1 day', now() - interval '1 day' + interval '5 minutes'),

('e0000001-0000-0000-0000-000000000006', 'QB-20260303-0002',
  'd0000001-0000-0000-0000-000000000004',
  'a0000001-0000-0000-0000-000000000002',
  4, 'LIST_4006381333931_8710447438268_5000159484428_4003994155486',
  'completed', now() - interval '1 day' + interval '2 hours',
  now() - interval '1 day' + interval '2 hours 3 minutes');

-- ===== Seed Scan Items =====
-- Session 1: 5 items
INSERT INTO scan_items (session_id, ean, sequence_number, scanned_at) VALUES
('e0000001-0000-0000-0000-000000000001', '4006381333931', 1, now() - interval '3 days'),
('e0000001-0000-0000-0000-000000000001', '0011200296908', 2, now() - interval '3 days' + interval '20 seconds'),
('e0000001-0000-0000-0000-000000000001', '8710447438268', 3, now() - interval '3 days' + interval '35 seconds'),
('e0000001-0000-0000-0000-000000000001', '5000159484428', 4, now() - interval '3 days' + interval '50 seconds'),
('e0000001-0000-0000-0000-000000000001', '4003994155486', 5, now() - interval '3 days' + interval '65 seconds');

-- Session 2: 3 items
INSERT INTO scan_items (session_id, ean, sequence_number, scanned_at) VALUES
('e0000001-0000-0000-0000-000000000002', '4006381333931', 1, now() - interval '3 days' + interval '30 minutes'),
('e0000001-0000-0000-0000-000000000002', '5000159484428', 2, now() - interval '3 days' + interval '30 minutes 15 seconds'),
('e0000001-0000-0000-0000-000000000002', '8710447438268', 3, now() - interval '3 days' + interval '30 minutes 30 seconds');

-- Session 3: 3 items
INSERT INTO scan_items (session_id, ean, sequence_number, scanned_at) VALUES
('e0000001-0000-0000-0000-000000000003', '4006381333931', 1, now() - interval '2 days'),
('e0000001-0000-0000-0000-000000000003', '4003994155486', 2, now() - interval '2 days' + interval '15 seconds'),
('e0000001-0000-0000-0000-000000000003', '5000159484428', 3, now() - interval '2 days' + interval '30 seconds');

-- Session 4: 7 items
INSERT INTO scan_items (session_id, ean, sequence_number, scanned_at) VALUES
('e0000001-0000-0000-0000-000000000004', '4006381333931', 1, now() - interval '2 days' + interval '1 hour'),
('e0000001-0000-0000-0000-000000000004', '0011200296908', 2, now() - interval '2 days' + interval '1 hour 15 seconds'),
('e0000001-0000-0000-0000-000000000004', '8710447438268', 3, now() - interval '2 days' + interval '1 hour 30 seconds'),
('e0000001-0000-0000-0000-000000000004', '5000159484428', 4, now() - interval '2 days' + interval '1 hour 45 seconds'),
('e0000001-0000-0000-0000-000000000004', '4003994155486', 5, now() - interval '2 days' + interval '1 hour 60 seconds'),
('e0000001-0000-0000-0000-000000000004', '4006381333931', 6, now() - interval '2 days' + interval '1 hour 75 seconds'),
('e0000001-0000-0000-0000-000000000004', '0011200296908', 7, now() - interval '2 days' + interval '1 hour 90 seconds');

-- Session 5: 6 items
INSERT INTO scan_items (session_id, ean, sequence_number, scanned_at) VALUES
('e0000001-0000-0000-0000-000000000005', '5000159484428', 1, now() - interval '1 day'),
('e0000001-0000-0000-0000-000000000005', '5000159484428', 2, now() - interval '1 day' + interval '15 seconds'),
('e0000001-0000-0000-0000-000000000005', '4003994155486', 3, now() - interval '1 day' + interval '30 seconds'),
('e0000001-0000-0000-0000-000000000005', '4003994155486', 4, now() - interval '1 day' + interval '45 seconds'),
('e0000001-0000-0000-0000-000000000005', '8710447438268', 5, now() - interval '1 day' + interval '60 seconds'),
('e0000001-0000-0000-0000-000000000005', '0011200296908', 6, now() - interval '1 day' + interval '75 seconds');

-- Session 6: 4 items
INSERT INTO scan_items (session_id, ean, sequence_number, scanned_at) VALUES
('e0000001-0000-0000-0000-000000000006', '4006381333931', 1, now() - interval '1 day' + interval '2 hours'),
('e0000001-0000-0000-0000-000000000006', '8710447438268', 2, now() - interval '1 day' + interval '2 hours 15 seconds'),
('e0000001-0000-0000-0000-000000000006', '5000159484428', 3, now() - interval '1 day' + interval '2 hours 30 seconds'),
('e0000001-0000-0000-0000-000000000006', '4003994155486', 4, now() - interval '1 day' + interval '2 hours 45 seconds');

-- ===== Seed Audit Log =====
INSERT INTO audit_log (entity_type, entity_id, action, user_id, created_at) VALUES
('session', 'e0000001-0000-0000-0000-000000000001', 'completed',
  'd0000001-0000-0000-0000-000000000001', now() - interval '3 days'),
('session', 'e0000001-0000-0000-0000-000000000002', 'completed',
  'd0000001-0000-0000-0000-000000000001', now() - interval '3 days'),
('session', 'e0000001-0000-0000-0000-000000000003', 'completed',
  'd0000001-0000-0000-0000-000000000002', now() - interval '2 days'),
('session', 'e0000001-0000-0000-0000-000000000004', 'completed',
  'd0000001-0000-0000-0000-000000000003', now() - interval '2 days'),
('session', 'e0000001-0000-0000-0000-000000000005', 'completed',
  'd0000001-0000-0000-0000-000000000001', now() - interval '1 day'),
('session', 'e0000001-0000-0000-0000-000000000006', 'completed',
  'd0000001-0000-0000-0000-000000000004', now() - interval '1 day');
