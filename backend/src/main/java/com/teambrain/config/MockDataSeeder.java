package com.teambrain.config;

import com.teambrain.entity.*;
import com.teambrain.repository.*;

import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@Order(3)
public class MockDataSeeder implements CommandLineRunner {

    private final UserRepository userRepo;
    private final RoleRepository roleRepo;
    private final TeamRepository teamRepo;
    private final TeamNodeRepository nodeRepo;
    private final NodeConnectionRepository connRepo;
    private final BrainRegionRepository regionRepo;
    private final UserTeamRepository userTeamRepo;
    private final PasswordEncoder encoder;

    public MockDataSeeder(UserRepository ur, RoleRepository rr, TeamRepository tr,
                          TeamNodeRepository nr, NodeConnectionRepository cr,
                          BrainRegionRepository br, UserTeamRepository utr, PasswordEncoder pe) {
        this.userRepo = ur; this.roleRepo = rr; this.teamRepo = tr;
        this.nodeRepo = nr; this.connRepo = cr;
        this.regionRepo = br; this.userTeamRepo = utr; this.encoder = pe;
    }

    @Override
    public void run(String... args) {
        boolean allExist = true;
        for (int i = 10; i <= 17; i++) {
            if (!userRepo.existsByUsername("user" + i)) { allExist = false; break; }
        }
        if (allExist) return;

        // Clean up partial mock data before re-seeding
        for (int i = 10; i <= 17; i++) {
            userRepo.findByUsername("user" + i).ifPresent(u -> userRepo.delete(u));
        }

        Role userRole = roleRepo.findByName("USER").orElseThrow();
        String pw = encoder.encode("123456");
        Random rng = new Random(42);

        String[][] teamData = {
            {"星辰科技", "AI驱动的企业数字化解决方案提供商", "tech"},
            {"云帆教育", "在线编程教育平台，服务10万+学员", "edu"},
            {"极光设计", "品牌设计与用户体验咨询工作室", "design"},
            {"磐石金融", "区块链金融科技创业团队", "finance"},
            {"绿洲农业", "智慧农业物联网监控系统", "agri"},
            {"天际传媒", "短视频内容创作与MCN机构", "media"},
            {"深蓝医疗", "医疗影像AI辅助诊断系统", "medical"},
            {"启航物流", "跨境物流智能调度平台", "logistics"},
        };

        // Domain-specific node templates — all teams get a rich mix
        String[][][] domainNodes = {
            // tech
            {{"CTO", "MEMBER"},{"产品总监","MEMBER"},{"技术负责人","MEMBER"},{"前端团队","MEMBER"},
             {"后端团队","MEMBER"},{"算法工程师","MEMBER"},{"测试负责人","MEMBER"},{"运维工程师","MEMBER"},
             {"AI平台v3.0","PROJECT"},{"智能客服系统","PROJECT"},{"数据中台建设","PROJECT"},
             {"模型训练集群","PROJECT"},{"私有化部署方案","PROJECT"},{"API开放平台","PROJECT"},
             {"合作伙伴计划","PROJECT"},{"技术峰会2024","PROJECT"},{"开源SDK发布","PROJECT"}},
            // edu
            {{"创始人","MEMBER"},{"课程总监","MEMBER"},{"教学组长","MEMBER"},{"讲师团队","MEMBER"},
             {"内容运营","MEMBER"},{"社区经理","MEMBER"},{"用户增长","MEMBER"},{"技术合伙人","MEMBER"},
             {"Python大师课","PROJECT"},{"Web全栈训练营","PROJECT"},{"AI入门课程","PROJECT"},
             {"企业培训包","PROJECT"},{"学习管理平台","PROJECT"},{"证书认证系统","PROJECT"},
             {"校园推广计划","PROJECT"},{"年度教育峰会","PROJECT"},{"开源课程项目","PROJECT"}},
            // design
            {{"创意总监","MEMBER"},{"品牌策略师","MEMBER"},{"UI设计组长","MEMBER"},{"插画师","MEMBER"},
             {"动效设计师","MEMBER"},{"用户体验研究员","MEMBER"},{"文案策划","MEMBER"},{"客户总监","MEMBER"},
             {"品牌焕新计划","PROJECT"},{"App界面设计","PROJECT"},{"官网视觉升级","PROJECT"},
             {"设计系统构建","PROJECT"},{"年度品牌报告","PROJECT"},{"产品包装设计","PROJECT"},
             {"社交媒体模板","PROJECT"},{"行业白皮书设计","PROJECT"}},
            // finance
            {{"CEO","MEMBER"},{"技术总监","MEMBER"},{"风控专家","MEMBER"},{"智能合约工程师","MEMBER"},
             {"后端架构师","MEMBER"},{"合规官","MEMBER"},{"用户运营","MEMBER"},{"市场总监","MEMBER"},
             {"去中心化交易平台","PROJECT"},{"跨链桥v2.0","PROJECT"},{"钱包SDK","PROJECT"},
             {"Staking平台","PROJECT"},{"安全审计报告","PROJECT"},{"DAO治理框架","PROJECT"},
             {"开发者工具集","PROJECT"},{"年度路演计划","PROJECT"},{"白皮书v3.0","PROJECT"}},
            // agri
            {{"创始人","MEMBER"},{"技术专家","MEMBER"},{"嵌入式工程师","MEMBER"},{"产品经理","MEMBER"},
             {"数据科学家","MEMBER"},{"农艺顾问","MEMBER"},{"销售总监","MEMBER"},{"项目经理","MEMBER"},
             {"IoT监控平台","PROJECT"},{"虫害预警系统","PROJECT"},{"智能灌溉方案","PROJECT"},
             {"土壤分析模型","PROJECT"},{"产量预测算法","PROJECT"},{"供应链管理","PROJECT"},
             {"农机调度系统","PROJECT"},{"示范区建设","PROJECT"},{"年度展会","PROJECT"}},
            // media
            {{"内容总监","MEMBER"},{"导演","MEMBER"},{"摄影指导","MEMBER"},{"后期剪辑","MEMBER"},
             {"编剧","MEMBER"},{"运营经理","MEMBER"},{"商务总监","MEMBER"},{"社群运营","MEMBER"},
             {"年度品牌片","PROJECT"},{"短视频矩阵","PROJECT"},{"直播带货计划","PROJECT"},
             {"纪录片系列","PROJECT"},{"KOL孵化营","PROJECT"},{"品牌联名项目","PROJECT"},
             {"海外频道运营","PROJECT"},{"数据看板开发","PROJECT"},{"年终盛典","PROJECT"}},
            // medical
            {{"首席医学官","MEMBER"},{"算法总监","MEMBER"},{"放射科顾问","MEMBER"},{"软件工程师","MEMBER"},
             {"标注团队","MEMBER"},{"产品经理","MEMBER"},{"临床研究员","MEMBER"},{"法规事务","MEMBER"},
             {"肺结节检测系统","PROJECT"},{"骨折AI诊断","PROJECT"},{"病理切片分析","PROJECT"},
             {"云PACS平台","PROJECT"},{"多中心临床试验","PROJECT"},{"FDA认证申报","PROJECT"},
             {"科研合作项目","PROJECT"},{"基层医疗方案","PROJECT"},{"学术论文发表","PROJECT"}},
            // logistics
            {{"CEO","MEMBER"},{"CTO","MEMBER"},{"算法工程师","MEMBER"},{"物流规划师","MEMBER"},
             {"车队管理","MEMBER"},{"客户成功经理","MEMBER"},{"海外运营","MEMBER"},{"数据分析师","MEMBER"},
             {"智能调度系统","PROJECT"},{"路径优化引擎","PROJECT"},{"仓储管理平台","PROJECT"},
             {"报关自动化","PROJECT"},{"冷链监控方案","PROJECT"},{"跨境支付集成","PROJECT"},
             {"碳排放追踪","PROJECT"},{"司机App重构","PROJECT"},{"年度客户大会","PROJECT"}},
        };

        List<User> users = new ArrayList<>();
        List<Team> teams = new ArrayList<>();

        int uid = 10;
        for (int ti = 0; ti < teamData.length; ti++) {
            String[] td = teamData[ti];
            User u = new User("user" + uid, pw);
            u.setEnabled(true);
            u.setRoles(Set.of(userRole));
            u = userRepo.save(u);
            users.add(u);

            Team t = new Team(td[0], td[1], u);
            t = teamRepo.save(t);
            teams.add(t);

            // Copy brain regions
            List<BrainRegion> templates = regionRepo.findByTeamIsNullOrderBySortOrderAsc();
            List<BrainRegion> teamRegions = new ArrayList<>();
            int sort = 1;
            for (BrainRegion template : templates) {
                BrainRegion r = new BrainRegion();
                r.setTeam(t); r.setName(template.getName());
                r.setColorHex(template.getColorHex()); r.setSortOrder(sort++);
                r.setTemplateRegionId(template.getId());
                teamRegions.add(regionRepo.save(r));
            }

            // Create 18–22 nodes
            String[][] nodePool = domainNodes[ti];
            int nodeCount = 18 + rng.nextInt(5);
            List<TeamNode> nodes = new ArrayList<>();
            for (int i = 0; i < nodeCount; i++) {
                String[] nd = nodePool[i % nodePool.length];
                BrainRegion region = teamRegions.get(i % teamRegions.size());
                TeamNode node = new TeamNode(t, region, nd[0],
                        nd[1].equals("MEMBER") ? "团队核心成员" : "重点推进项目",
                        TeamNode.NodeType.valueOf(nd[1]));
                if (i == 0) node.setTags("leader");
                if (i == 1 || i == 2)
                    node.setTags("leader,bridge:" + teamRegions.get((i+1) % teamRegions.size()).getId());
                nodes.add(nodeRepo.save(node));
            }

            // Create connections: adjacent nodes within same region
            for (int i = 0; i < nodes.size() - 1; i++) {
                TeamNode a = nodes.get(i);
                TeamNode b = nodes.get(i + 1);
                NodeConnection conn = new NodeConnection();
                conn.setTeam(t);
                conn.setFromNode(a);
                conn.setToNode(b);
                conn.setTargetType(NodeConnection.TargetType.SINGLE);
                conn.setConnectionType("management");
                conn.setColorHex("#ffaa44");
                conn.setLineWidth(0.02);
                conn.setFlowColorHex("#ffaa44");
                conn.setOpacity(0.7);
                try { connRepo.save(conn); } catch (Exception ignored) {}
            }
            uid++;
        }

        // Rich cross-memberships: each user joins 3-4 other teams
        for (int i = 0; i < users.size(); i++) {
            User member = users.get(i);
            Set<Long> joined = new HashSet<>();
            joined.add(teams.get(i).getId()); // skip own team
            // Join next 3 teams in the list
            for (int j = 1; j <= 3 && j < teams.size(); j++) {
                Team joinTeam = teams.get((i + j) % teams.size());
                if (joined.add(joinTeam.getId())) {
                    userTeamRepo.save(new UserTeam(member.getId(), joinTeam.getId()));
                }
            }
            // First 3 users also join team 1 (影视飓风)
            if (i < 3) {
                try { userTeamRepo.save(new UserTeam(member.getId(), 1L)); } catch (Exception ignored) {}
            }
        }

        System.out.println("Mock data seeded: " + teamData.length + " teams, " + uid + " users");
    }
}
