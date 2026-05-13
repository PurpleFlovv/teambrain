-- 角色初始化
INSERT IGNORE INTO sys_role (id, name) VALUES (1, 'USER');
INSERT IGNORE INTO sys_role (id, name) VALUES (2, 'ADMIN');

-- 脑区初始化
INSERT IGNORE INTO brain_region (id, name, color_hex, sort_order) VALUES
(1, '前额叶', '#FFB347', 1),
(2, '额叶', '#44AAFF', 2),
(3, '顶叶', '#AA44FF', 3),
(4, '颞叶', '#44FFAA', 4),
(5, '枕叶', '#FF8844', 5),
(6, '小脑/脑干', '#FF4477', 6);
