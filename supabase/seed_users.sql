-- ============================================
-- Primark Qbust.it POC — Extended User Seed
-- Run after seed.sql
-- Sets all existing PINs to 1234 and adds
-- additional colleagues across all five stores.
-- ============================================

-- ===== Reset all existing PINs to 1234 =====
UPDATE users SET pin = '1234';

-- ===== Additional Users =====
-- All new users have PIN: 1234
INSERT INTO users (id, name, email, pin, store_id, role) VALUES

-- Manchester Arndale (MAN01)
('d0000001-0000-0000-0000-000000000006', 'Priya S',   'priya.s@primark.com',   '1234',
  'a0000001-0000-0000-0000-000000000001', 'floor_colleague'),
('d0000001-0000-0000-0000-000000000007', 'Leon T',    'leon.t@primark.com',    '1234',
  'a0000001-0000-0000-0000-000000000001', 'floor_colleague'),
('d0000001-0000-0000-0000-000000000008', 'Rachel H',  'rachel.h@primark.com',  '1234',
  'a0000001-0000-0000-0000-000000000001', 'floor_colleague'),

-- Birmingham Primark (BHM01)
('d0000001-0000-0000-0000-000000000009', 'Marcus O',  'marcus.o@primark.com',  '1234',
  'a0000001-0000-0000-0000-000000000002', 'floor_colleague'),
('d0000001-0000-0000-0000-000000000010', 'Fatima A',  'fatima.a@primark.com',  '1234',
  'a0000001-0000-0000-0000-000000000002', 'floor_colleague'),
('d0000001-0000-0000-0000-000000000011', 'Nina P',    'nina.p@primark.com',    '1234',
  'a0000001-0000-0000-0000-000000000002', 'store_manager'),

-- London Oxford Street (LON01)
('d0000001-0000-0000-0000-000000000012', 'Jake W',    'jake.w@primark.com',    '1234',
  'a0000001-0000-0000-0000-000000000003', 'floor_colleague'),
('d0000001-0000-0000-0000-000000000013', 'Chloe B',   'chloe.b@primark.com',   '1234',
  'a0000001-0000-0000-0000-000000000003', 'floor_colleague'),
('d0000001-0000-0000-0000-000000000014', 'Omar N',    'omar.n@primark.com',    '1234',
  'a0000001-0000-0000-0000-000000000003', 'store_manager'),

-- Leeds White Rose (LDS01)
('d0000001-0000-0000-0000-000000000015', 'Hannah C',  'hannah.c@primark.com',  '1234',
  'a0000001-0000-0000-0000-000000000004', 'floor_colleague'),
('d0000001-0000-0000-0000-000000000016', 'Ryan F',    'ryan.f@primark.com',    '1234',
  'a0000001-0000-0000-0000-000000000004', 'floor_colleague'),
('d0000001-0000-0000-0000-000000000017', 'Zoe M',     'zoe.m@primark.com',     '1234',
  'a0000001-0000-0000-0000-000000000004', 'store_manager'),

-- Dublin Mary Street (DUB01)
('d0000001-0000-0000-0000-000000000018', 'Aoife D',   'aoife.d@primark.com',   '1234',
  'a0000001-0000-0000-0000-000000000005', 'floor_colleague'),
('d0000001-0000-0000-0000-000000000019', 'Ciaran R',  'ciaran.r@primark.com',  '1234',
  'a0000001-0000-0000-0000-000000000005', 'floor_colleague'),
('d0000001-0000-0000-0000-000000000020', 'Siobhan K', 'siobhan.k@primark.com', '1234',
  'a0000001-0000-0000-0000-000000000005', 'store_manager');
