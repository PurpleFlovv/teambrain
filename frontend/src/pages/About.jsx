import React from 'react';
import PageShell from '../components/shared/PageShell';
import GlassCard from '../components/shared/GlassCard';

const About = () => (
  <PageShell maxWidth="max-w-2xl">
    <GlassCard className="p-8 text-center">
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">TeamBrain</h1>
      <p className="text-[var(--text-muted)] leading-relaxed mb-4">
        TeamBrain 是一个组织架构可视化平台。将团队的成员和项目映射到 3D 大脑模型的不同脑区，直观展示组织结构和协作关系。
      </p>
      <p className="text-[var(--text-muted)] leading-relaxed mb-4">
        支持多团队、角色权限（系统管理员 / 团队管理员 / 普通用户）、自动连接策略（同区协作、负责关系、跨区桥接）和拖拽交互。
      </p>
      <p className="text-[var(--text-muted)] text-sm mt-8">
        技术栈：Spring Boot 3.4 + React 18 + Three.js + Tailwind CSS
      </p>
    </GlassCard>
  </PageShell>
);

export default About;
