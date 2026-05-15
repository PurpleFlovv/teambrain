-- 角色初始化
INSERT IGNORE INTO sys_role (id, name) VALUES (1, 'USER');
INSERT IGNORE INTO sys_role (id, name) VALUES (2, 'ADMIN');
INSERT IGNORE INTO sys_role (id, name) VALUES (3, 'TEAM_ADMIN');

-- 脑区初始化
INSERT IGNORE INTO brain_region (id, name, color_hex, sort_order, team_id, template_region_id) VALUES
(1, '前额叶', '#FFB347', 1, NULL, NULL),
(2, '额叶后部', '#44AAFF', 2, NULL, NULL),
(3, '顶叶', '#AA44FF', 3, NULL, NULL),
(4, '颞叶', '#44FFAA', 4, NULL, NULL),
(5, '枕叶', '#FF8844', 5, NULL, NULL),
(6, '小脑/脑干', '#FF4477', 6, NULL, NULL);

-- 管理员账号 admin / admin123
INSERT IGNORE INTO sys_user (id, username, password, enabled)
VALUES (1, 'admin', '$2b$10$bYQYS65kDwAzSEmxJ7UGHu7/GjVBul1.w34T8HJ.8ZFvpP6kcip5G', true);
INSERT IGNORE INTO sys_user_role (user_id, role_id) VALUES (1, 1);
INSERT IGNORE INTO sys_user_role (user_id, role_id) VALUES (1, 2);
INSERT IGNORE INTO team (id, team_name, description, user_id)
VALUES (1, '影视飓风', '无限进步 | 全网粉丝2800万+', 1);

-- 影视飓风团队节点
-- 前额叶: 核心管理层
INSERT IGNORE INTO team_node (id, team_id, brain_region_id, name, description, node_type) VALUES
(1, 1, 1, 'Tim（潘天鸿）', '影视飓风创始人，频道主理人，负责整体方向与内容创意', 'MEMBER'),
(2, 1, 1, 'Owen', '联合创始人，技术总监，负责硬件与特效技术支持', 'MEMBER'),
(3, 1, 1, '运营组', '内容发布、商务对接、社群管理', 'MEMBER');

-- 额叶: 创意策划与内容产出
INSERT IGNORE INTO team_node (id, team_id, brain_region_id, name, description, node_type) VALUES
(4, 1, 2, '创意策划组', '选题策划、脚本撰写、分镜设计', 'MEMBER'),
(5, 1, 2, '《影视飓风》正片', '核心系列，深度影视制作技术分享', 'PROJECT'),
(6, 1, 2, '卫星发射计划', '与影石Insta360合作，将相机送上太空拍摄地球', 'PROJECT'),
(7, 1, 2, '荒岛求生100小时', '2025年直播挑战，累计观看1.69亿次', 'PROJECT'),
(8, 1, 2, '画质压缩揭露视频', '2024年引发行业热议的爆款视频', 'PROJECT'),
(9, 1, 2, '《飓多多》', '轻松有趣的短内容，展现幕后日常', 'PROJECT'),
(10, 1, 2, '《亿点点不一样》', '旗下子账号，频频出现爆款内容', 'PROJECT'),
(11, 1, 2, '百大UP主创业故事', '系列纪录片，分享管理心路', 'PROJECT'),
(12, 1, 2, 'MOMA猛玛代言', '2024年达成品牌代言合作', 'PROJECT');

-- 顶叶: 技术执行
INSERT IGNORE INTO team_node (id, team_id, brain_region_id, name, description, node_type) VALUES
(13, 1, 3, '摄影组', '负责所有视频的拍摄、灯光、构图', 'MEMBER'),
(14, 1, 3, '剪辑组', '后期剪辑、调色、音效', 'MEMBER'),
(15, 1, 3, '《测评》系列', '摄影器材、数码产品深度评测', 'PROJECT'),
(16, 1, 3, '双推流直播方案', '5G条件下的高画质、低延迟直播技术', 'PROJECT');

-- 颞叶: 商务运营
INSERT IGNORE INTO team_node (id, team_id, brain_region_id, name, description, node_type) VALUES
(17, 1, 4, '商务组', '品牌合作、广告对接', 'MEMBER'),
(18, 1, 4, '电商组', '自营产品、供应链管理', 'MEMBER'),
(19, 1, 4, 'B2B出海平台', '2025年入驻阿里国际站', 'PROJECT'),
(20, 1, 4, '合作品牌', 'OPPO、英雄联盟、守望先锋、NOMO等', 'PROJECT');

-- 枕叶: 品牌与愿景
INSERT IGNORE INTO team_node (id, team_id, brain_region_id, name, description, node_type) VALUES
(21, 1, 5, '年度iPhone福利', '连续多年为全体员工换新iPhone', 'PROJECT'),
(22, 1, 5, '公司规模', '2024年营收过亿，全网粉丝超2800万', 'PROJECT'),
(23, 1, 5, '杭州总部', '位于杭州市余杭区良渚街道', 'PROJECT');

-- 小脑/脑干: 企业文化
INSERT IGNORE INTO team_node (id, team_id, brain_region_id, name, description, node_type) VALUES
(24, 1, 6, '企业文化', '口号：无限进步', 'MEMBER');

-- 连接规则
INSERT IGNORE INTO node_connection (id, team_id, from_node_id, to_node_id, target_type, connection_type, color_hex, line_width, flow_color_hex, opacity) VALUES
(1, 1, 1, 4, 'SINGLE', 'management', '#ffaa44', 0.03, '#ffaa44', 0.8),
(2, 1, 1, 13, 'SINGLE', 'management', '#ffaa44', 0.03, '#ffaa44', 0.8),
(3, 1, 1, 14, 'SINGLE', 'management', '#ffaa44', 0.03, '#ffaa44', 0.8),
(4, 1, 1, 17, 'SINGLE', 'management', '#ffaa44', 0.03, '#ffaa44', 0.8),
(5, 1, 1, 18, 'SINGLE', 'management', '#ffaa44', 0.03, '#ffaa44', 0.8),
(6, 1, 2, 4, 'SINGLE', 'management', '#ffaa44', 0.03, '#ffaa44', 0.8),
(7, 1, 3, 4, 'SINGLE', 'management', '#ffaa44', 0.03, '#ffaa44', 0.8),
(8, 1, 4, 9, 'SINGLE', 'creative', '#44aaff', 0.02, '#44aaff', 0.8),
(9, 1, 4, 10, 'SINGLE', 'creative', '#44aaff', 0.02, '#44aaff', 0.8),
(10, 1, 4, 11, 'SINGLE', 'creative', '#44aaff', 0.02, '#44aaff', 0.8),
(11, 1, 4, 12, 'SINGLE', 'creative', '#44aaff', 0.02, '#44aaff', 0.8),
(12, 1, 13, 5, 'SINGLE', 'production', '#aa44ff', 0.02, '#aa44ff', 0.8),
(13, 1, 14, 5, 'SINGLE', 'production', '#aa44ff', 0.02, '#aa44ff', 0.8),
(14, 1, 13, 15, 'SINGLE', 'production', '#aa44ff', 0.02, '#aa44ff', 0.8),
(15, 1, 14, 15, 'SINGLE', 'production', '#aa44ff', 0.02, '#aa44ff', 0.8),
(16, 1, 13, 6, 'SINGLE', 'production', '#aa44ff', 0.02, '#aa44ff', 0.8),
(17, 1, 14, 6, 'SINGLE', 'production', '#aa44ff', 0.02, '#aa44ff', 0.8),
(18, 1, 13, 7, 'SINGLE', 'production', '#aa44ff', 0.02, '#aa44ff', 0.8),
(19, 1, 14, 7, 'SINGLE', 'production', '#aa44ff', 0.02, '#aa44ff', 0.8),
(20, 1, 13, 8, 'SINGLE', 'production', '#aa44ff', 0.02, '#aa44ff', 0.8),
(21, 1, 14, 8, 'SINGLE', 'production', '#aa44ff', 0.02, '#aa44ff', 0.8),
(22, 1, 17, 20, 'SINGLE', 'business', '#44ffaa', 0.015, '#44ffaa', 0.8),
(23, 1, 18, 20, 'SINGLE', 'business', '#44ffaa', 0.015, '#44ffaa', 0.8),
(24, 1, 17, 19, 'SINGLE', 'business', '#44ffaa', 0.015, '#44ffaa', 0.8),
(25, 1, 18, 19, 'SINGLE', 'business', '#44ffaa', 0.015, '#44ffaa', 0.8),
(26, 1, 24, NULL, 'ALL', 'culture', '#ff8844', 0.01, '#ff8844', 0.6),
(27, 1, 21, NULL, 'ALL', 'culture', '#ff8844', 0.01, '#ff8844', 0.6),
(28, 1, 22, NULL, 'ALL', 'culture', '#ff8844', 0.01, '#ff8844', 0.6),
(29, 1, 23, NULL, 'ALL', 'culture', '#ff8844', 0.01, '#ff8844', 0.6);
