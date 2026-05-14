# TeamBrain Unified UI/UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify TeamBrain's UI by adopting shadcn/ui with a "Cosmic Glass" design system (Space Tech palette + glassmorphism), extracting duplicated components, and standardizing all pages.

**Architecture:** Component-first approach. Phase 1 defines CSS design tokens. Phase 2 creates 4 shared components (GlassCard, GlassModal, FormField, PageShell). Phase 3 extracts duplicated modals. Phase 4 refactors 9 pages + Admin layout to use the new system.

**Tech Stack:** React 18, Vite 5, Tailwind CSS 3.4, shadcn/ui (Radix), lucide-react

---

### Task 1: Design Tokens — Update index.css with Cosmic Glass variables

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/tailwind.config.js`

- [ ] **Step 1: Replace index.css with Cosmic Glass design tokens**

Write `frontend/src/index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;

    /* Cosmic Glass — Dark (default) */
    --bg-deep-space: #0B0B10;
    --bg-midnight: #0A0E27;
    --bg-navy: #0F172A;
    --glass-bg: rgba(15, 23, 42, 0.55);
    --glass-blur: 16px;
    --glass-border: rgba(148, 163, 184, 0.12);
    --accent: #3B82F6;
    --accent-soft: #60A5FA;
    --accent-glow: 0 0 30px rgba(59, 130, 246, 0.15);
    --text-primary: #F8FAFC;
    --text-muted: #94A3B8;
    --success: #22C55E;
    --warning: #F59E0B;
    --destructive: #EF4444;

    /* shadcn/ui overrides — map to Cosmic Glass palette */
    --background: 222 47% 5%;
    --foreground: 210 40% 98%;
    --card: 222 47% 7%;
    --card-foreground: 210 40% 98%;
    --popover: 222 47% 7%;
    --popover-foreground: 210 40% 98%;
    --primary: 217 91% 60%;
    --primary-foreground: 210 40% 98%;
    --secondary: 217 33% 17%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217 33% 17%;
    --muted-foreground: 215 20% 65%;
    --accent: 217 33% 17%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 63% 31%;
    --destructive-foreground: 210 40% 98%;
    --border: 217 33% 17%;
    --input: 217 33% 17%;
    --ring: 213 27% 84%;
    --radius: 0.5rem;
  }

  .light {
    --bg-deep-space: #F8FAFC;
    --bg-midnight: #F1F5F9;
    --bg-navy: #FFFFFF;
    --glass-bg: rgba(255, 255, 255, 0.75);
    --glass-border: rgba(0, 0, 0, 0.08);
    --accent: #2563EB;
    --accent-soft: #3B82F6;
    --accent-glow: none;
    --text-primary: #0F172A;
    --text-muted: #475569;
    --success: #16A34A;
    --warning: #D97706;
    --destructive: #DC2626;

    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;
    --primary: 221 83% 53%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222 47% 11%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --accent: 210 40% 96%;
    --accent-foreground: 222 47% 11%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 210 40% 98%;
    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 222 84% 5%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: var(--font-sans);
  }
}
```

- [ ] **Step 2: Update tailwind.config.js to add font family**

Edit `frontend/tailwind.config.js`, add `fontFamily` to the `extend` block (after `borderRadius`):

```js
fontFamily: {
  sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
},
```

The full `extend` block should now include `colors`, `borderRadius`, `fontFamily`, `keyframes`, `animation`.

- [ ] **Step 3: Verify the app loads without CSS errors**

```bash
cd /home/mpt/projects/TeamBrain/frontend && npm run build 2>&1 | tail -5
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/index.css frontend/tailwind.config.js
git commit -m "feat: add Cosmic Glass design tokens and Plus Jakarta Sans font"
```

---

### Task 2: Create GlassCard shared component

**Files:**
- Create: `frontend/src/components/shared/GlassCard.jsx`

- [ ] **Step 1: Create the GlassCard component**

Write `frontend/src/components/shared/GlassCard.jsx`:

```jsx
import { cn } from '@/lib/utils';

const GlassCard = ({ variant = 'default', className, children, ...props }) => (
  <div
    className={cn(
      'rounded-lg border backdrop-blur-[16px]',
      variant === 'accent'
        ? 'bg-[var(--glass-bg)] border-[var(--accent)]/20 shadow-[var(--accent-glow)]'
        : 'bg-[var(--glass-bg)] border-[var(--glass-border)]',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export default GlassCard;
```

- [ ] **Step 2: Verify the component compiles**

```bash
cd /home/mpt/projects/TeamBrain/frontend && npx vite build 2>&1 | tail -5
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/shared/GlassCard.jsx
git commit -m "feat: add GlassCard shared component with default/accent variants"
```

---

### Task 3: Create GlassModal shared component

**Files:**
- Create: `frontend/src/components/shared/GlassModal.jsx`

- [ ] **Step 1: Create the GlassModal component**

Write `frontend/src/components/shared/GlassModal.jsx`:

```jsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const GlassModal = ({ open, onOpenChange, title, description, children, className }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      className={cn(
        'bg-[var(--glass-bg)] backdrop-blur-[16px] border-[var(--glass-border)] text-[var(--text-primary)]',
        className
      )}
    >
      {(title || description) && (
        <DialogHeader>
          {title && <DialogTitle className="text-[var(--text-primary)]">{title}</DialogTitle>}
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
      )}
      {children}
    </DialogContent>
  </Dialog>
);

export default GlassModal;
```

But wait — import `cn` is missing. Fix that:

```jsx
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const GlassModal = ({ open, onOpenChange, title, description, children, className }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      className={cn(
        'bg-[var(--glass-bg)] backdrop-blur-[16px] border-[var(--glass-border)] text-[var(--text-primary)] max-h-[85vh] overflow-y-auto',
        className
      )}
    >
      {(title || description) && (
        <DialogHeader>
          {title && <DialogTitle className="text-[var(--text-primary)]">{title}</DialogTitle>}
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
      )}
      {children}
    </DialogContent>
  </Dialog>
);

export default GlassModal;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/shared/GlassModal.jsx
git commit -m "feat: add GlassModal shared component wrapping shadcn Dialog"
```

---

### Task 4: Create FormField shared component

**Files:**
- Create: `frontend/src/components/shared/FormField.jsx`

- [ ] **Step 1: Create the FormField component**

Write `frontend/src/components/shared/FormField.jsx`:

```jsx
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const FormField = ({ label, error, htmlFor, className, children }) => (
  <div className={cn('space-y-1.5', className)}>
    {label && (
      <Label htmlFor={htmlFor} className="text-[var(--text-primary)] text-sm">
        {label}
      </Label>
    )}
    {children}
    {error && <p className="text-xs text-[var(--destructive)]">{error}</p>}
  </div>
);

export default FormField;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/shared/FormField.jsx
git commit -m "feat: add FormField shared component for consistent form layout"
```

---

### Task 5: Create PageShell shared component

**Files:**
- Create: `frontend/src/components/shared/PageShell.jsx`

- [ ] **Step 1: Create the PageShell component**

Write `frontend/src/components/shared/PageShell.jsx`:

```jsx
import { cn } from '@/lib/utils';

const PageShell = ({ loading, error, maxWidth = 'max-w-4xl', className, children }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-[var(--text-muted)] text-lg animate-pulse">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <p className="text-[var(--text-muted)]">加载失败</p>
          <p className="text-[var(--destructive)] text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('p-6 mx-auto', maxWidth, className)}>
      {children}
    </div>
  );
};

export default PageShell;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/shared/PageShell.jsx
git commit -m "feat: add PageShell shared component for consistent page layout"
```

---

### Task 6: Extract NodeModal, RegionModal, DeleteRegionModal to shared components

**Files:**
- Create: `frontend/src/components/shared/NodeModal.jsx`
- Create: `frontend/src/components/shared/RegionModal.jsx`
- Create: `frontend/src/components/shared/DeleteRegionModal.jsx`
- Modify: `frontend/src/pages/MyTeamDetail.jsx`
- Modify: `frontend/src/pages/TeamEditPage.jsx`

- [ ] **Step 1: Create shared NodeModal.jsx**

Write `frontend/src/components/shared/NodeModal.jsx`:

```jsx
import { useState } from 'react';
import GlassModal from './GlassModal';
import FormField from './FormField';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const NodeModal = ({ mode, initial, teamRegions, onSave, onCancel }) => {
  const [name, setName] = useState(initial?.name || '');
  const [desc, setDesc] = useState(initial?.description || '');
  const [nodeType, setNodeType] = useState(initial?.nodeType || 'MEMBER');
  const [brainRegionId, setBrainRegionId] = useState(
    initial?.brainRegionId != null ? String(initial.brainRegionId) : ''
  );
  const [tags, setTags] = useState(initial?.tags || '');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: desc.trim(),
      nodeType,
      brainRegionId: brainRegionId ? parseInt(brainRegionId) : null,
      tags: tags.trim(),
    });
  };

  return (
    <GlassModal
      open={true}
      onOpenChange={onCancel}
      title={mode === 'create' ? '新建节点' : '编辑节点'}
      className="sm:max-w-md"
    >
      <div className="space-y-4">
        <FormField label="节点名称">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="节点名称" autoFocus />
        </FormField>
        <FormField label="类型">
          <Select value={nodeType} onValueChange={setNodeType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MEMBER">成员</SelectItem>
              <SelectItem value="PROJECT">项目</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="所属脑区">
          <Select value={brainRegionId} onValueChange={setBrainRegionId}>
            <SelectTrigger>
              <SelectValue placeholder={mode === 'create' ? '选择脑区...' : '未分配'} />
            </SelectTrigger>
            <SelectContent>
              {mode !== 'create' && <SelectItem value="">未分配</SelectItem>}
              {teamRegions.map(r => (
                <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="描述">
          <Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="节点描述（可选）" />
        </FormField>
        <FormField label="标签（可选）">
          <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="如: leader, bridge:3" />
        </FormField>
        <div className="flex justify-end space-x-3 pt-2">
          <Button variant="secondary" onClick={onCancel}>取消</Button>
          <Button onClick={handleSave}>保存</Button>
        </div>
      </div>
    </GlassModal>
  );
};

export default NodeModal;
```

- [ ] **Step 2: Create shared RegionModal.jsx**

Write `frontend/src/components/shared/RegionModal.jsx`:

```jsx
import { useState } from 'react';
import GlassModal from './GlassModal';
import FormField from './FormField';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const RegionModal = ({ mode, initial, templateRegions, onSave, onCancel }) => {
  const [name, setName] = useState(initial?.name || '');
  const [colorHex, setColorHex] = useState(initial?.colorHex || '#44aaff');
  const [templateRegionId, setTemplateRegionId] = useState(
    initial?.templateRegionId != null ? String(initial.templateRegionId) : ''
  );

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      colorHex,
      templateRegionId: templateRegionId ? parseInt(templateRegionId) : null,
    });
  };

  return (
    <GlassModal
      open={true}
      onOpenChange={onCancel}
      title={mode === 'create' ? '新建脑区' : '编辑脑区'}
      className="sm:max-w-md"
    >
      <div className="space-y-4">
        <FormField label="脑区名称">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="脑区名称" autoFocus />
        </FormField>
        <FormField label="颜色">
          <div className="flex items-center space-x-2">
            <input type="color" value={colorHex} onChange={e => setColorHex(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
            <Input value={colorHex} onChange={e => setColorHex(e.target.value)} className="flex-1 font-mono" />
          </div>
        </FormField>
        {mode === 'create' && (
          <FormField label="模板脑区">
            <Select value={templateRegionId} onValueChange={setTemplateRegionId}>
              <SelectTrigger>
                <SelectValue placeholder="选择模板脑区..." />
              </SelectTrigger>
              <SelectContent>
                {templateRegions.map(r => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
        <div className="flex justify-end space-x-3 pt-2">
          <Button variant="secondary" onClick={onCancel}>取消</Button>
          <Button onClick={handleSave}>保存</Button>
        </div>
      </div>
    </GlassModal>
  );
};

export default RegionModal;
```

- [ ] **Step 3: Create shared DeleteRegionModal.jsx**

Write `frontend/src/components/shared/DeleteRegionModal.jsx`:

```jsx
import { useState } from 'react';
import GlassModal from './GlassModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const DeleteRegionModal = ({ region, targetRegions, regionNodes, onConfirm, onCancel }) => {
  const [reassignToRegionId, setReassignToRegionId] = useState('');
  const [setUnassigned, setSetUnassigned] = useState(false);

  const handleConfirm = () => {
    if (setUnassigned) {
      onConfirm({ setUnassigned: true, reassignToRegionId: null });
    } else if (reassignToRegionId) {
      onConfirm({ setUnassigned: false, reassignToRegionId: parseInt(reassignToRegionId) });
    }
  };

  return (
    <GlassModal
      open={true}
      onOpenChange={onCancel}
      title={`删除脑区: ${region?.name}`}
      className="sm:max-w-md"
    >
      {regionNodes.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">
            该脑区下有 <span className="font-bold text-[var(--warning)]">{regionNodes.length}</span> 个节点，请选择处理方式：
          </p>
          <RadioGroup value={setUnassigned ? 'unassigned' : 'reassign'} onValueChange={v => setSetUnassigned(v === 'unassigned')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="reassign" id="reassign" />
              <Label htmlFor="reassign">移动到其他脑区</Label>
            </div>
            {!setUnassigned && (
              <Select value={reassignToRegionId} onValueChange={setReassignToRegionId}>
                <SelectTrigger className="ml-6">
                  <SelectValue placeholder="选择目标脑区..." />
                </SelectTrigger>
                <SelectContent>
                  {targetRegions.map(r => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="unassigned" id="unassigned" />
              <Label htmlFor="unassigned">标记为未分配</Label>
            </div>
          </RadioGroup>
        </div>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">该脑区下没有节点，确认删除？</p>
      )}
      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="secondary" onClick={onCancel}>取消</Button>
        <Button
          variant="destructive"
          onClick={handleConfirm}
          disabled={!setUnassigned && !reassignToRegionId && regionNodes.length > 0}
        >
          确认删除
        </Button>
      </div>
    </GlassModal>
  );
};

export default DeleteRegionModal;
```

- [ ] **Step 4: Update MyTeamDetail.jsx — remove inline modal definitions, import shared ones**

In `frontend/src/pages/MyTeamDetail.jsx`:
- Delete the `NodeModal`, `RegionModal`, `DeleteRegionModal` component definitions (lines 15-223)
- Add imports at top:

```jsx
import NodeModal from '../components/shared/NodeModal';
import RegionModal from '../components/shared/RegionModal';
import DeleteRegionModal from '../components/shared/DeleteRegionModal';
```

- [ ] **Step 5: Update TeamEditPage.jsx — same treatment**

In `frontend/src/pages/TeamEditPage.jsx`:
- Delete the `NodeModal`, `RegionModal`, `DeleteRegionModal` component definitions (lines 15-225)
- Add imports at top:

```jsx
import NodeModal from '../components/shared/NodeModal';
import RegionModal from '../components/shared/RegionModal';
import DeleteRegionModal from '../components/shared/DeleteRegionModal';
```

- [ ] **Step 6: Verify build**

```bash
cd /home/mpt/projects/TeamBrain/frontend && npm run build 2>&1 | tail -10
```

Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/shared/NodeModal.jsx frontend/src/components/shared/RegionModal.jsx frontend/src/components/shared/DeleteRegionModal.jsx frontend/src/pages/MyTeamDetail.jsx frontend/src/pages/TeamEditPage.jsx
git commit -m "feat: extract NodeModal, RegionModal, DeleteRegionModal to shared components"
```

---

### Task 7: Refactor LoginPage with shadcn components

**Files:**
- Modify: `frontend/src/pages/LoginPage.jsx`

- [ ] **Step 1: Rewrite LoginPage**

Write `frontend/src/pages/LoginPage.jsx`:

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import FormField from '../components/shared/FormField';

const LoginPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await register(username, password, email);
      } else {
        await login(username, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '操作失败');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--bg-deep-space)]">
      <Card className="w-full max-w-md bg-[var(--glass-bg)] backdrop-blur-[16px] border-[var(--glass-border)] text-[var(--text-primary)]">
        <CardHeader>
          <CardTitle className="text-center text-[var(--text-primary)]">
            {isRegister ? '注册 TeamBrain' : '登录 TeamBrain'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-[var(--destructive)]/20 border border-[var(--destructive)] rounded p-3 mb-4 text-[var(--destructive)] text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="用户名">
              <Input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
            </FormField>
            {isRegister && (
              <FormField label="邮箱">
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </FormField>
            )}
            <FormField label="密码">
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </FormField>
            <Button type="submit" className="w-full">
              {isRegister ? '注册' : '登录'}
            </Button>
          </form>
          <p className="text-sm mt-4 text-center text-[var(--text-muted)] cursor-pointer"
             onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
```

- [ ] **Step 2: Build check**

```bash
cd /home/mpt/projects/TeamBrain/frontend && npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/LoginPage.jsx
git commit -m "refactor: rewrite LoginPage with shadcn Card, Input, Button components"
```

---

### Task 8: Refactor MyTeams page with GlassCard + PageShell

**Files:**
- Modify: `frontend/src/pages/MyTeams.jsx`

- [ ] **Step 1: Rewrite MyTeams page**

Write `frontend/src/pages/MyTeams.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/shared/GlassCard';
import PageShell from '../components/shared/PageShell';
import { Button } from '@/components/ui/button';
import api from '../services/api';

const MyTeams = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    api.get('/teams/public').then(r => setTeams(r.data)).catch(() => {});
  }, []);

  return (
    <PageShell maxWidth="max-w-4xl">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">我的团队</h2>
      {teams.length === 0 ? (
        <div className="text-[var(--text-muted)] text-center py-12">
          <p className="mb-4">暂无团队</p>
          <Button onClick={() => navigate('/teams')}>浏览团队广场</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {teams.map(t => (
            <GlassCard
              key={t.id}
              onClick={() => navigate(`/my-teams/${t.id}`)}
              className="p-6 cursor-pointer hover:border-[var(--accent)]/30 transition-all"
            >
              <h3 className="font-bold text-lg mb-2 text-[var(--text-primary)]">{t.teamName}</h3>
              <p className="text-sm mb-4 text-[var(--text-muted)]">{t.description || '暂无描述'}</p>
              <div className="flex items-center space-x-4 text-xs text-[var(--text-muted)]">
                <span>{t.memberCount} 成员</span>
                <span>{t.projectCount} 项目</span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </PageShell>
  );
};

export default MyTeams;
```

- [ ] **Step 2: Build check**

```bash
cd /home/mpt/projects/TeamBrain/frontend && npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/MyTeams.jsx
git commit -m "refactor: rewrite MyTeams with GlassCard and PageShell"
```

---

### Task 9: Refactor TeamSquare and JoinTeam pages

**Files:**
- Modify: `frontend/src/pages/TeamSquare.jsx`
- Modify: `frontend/src/pages/JoinTeam.jsx`

- [ ] **Step 1: Rewrite TeamSquare with GlassCard + GlassModal**

Write `frontend/src/pages/TeamSquare.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/shared/GlassCard';
import GlassModal from '../components/shared/GlassModal';
import PageShell from '../components/shared/PageShell';
import { Button } from '@/components/ui/button';
import api from '../services/api';

const TeamSquare = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [selected, setSelected] = useState(null);
  const [joinedIds, setJoinedIds] = useState(new Set());

  useEffect(() => {
    api.get('/teams/public').then(r => setTeams(r.data)).catch(() => {});
  }, []);

  const openDetail = (team) => {
    api.get(`/teams/${team.id}/regions`)
      .then(r => setSelected({ ...team, regions: r.data }))
      .catch(() => {});
  };

  const handleJoin = async (team) => {
    try {
      await api.post(`/teams/${team.id}/join`);
      setJoinedIds(prev => new Set([...prev, team.id]));
      setSelected(null);
    } catch (err) {
      console.error('Join failed:', err);
    }
  };

  return (
    <PageShell maxWidth="max-w-5xl">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">团队广场</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {teams.map(t => (
          <GlassCard key={t.id} className="p-6">
            <h3 className="font-bold text-lg mb-2 text-[var(--text-primary)]">{t.teamName}</h3>
            <p className="text-sm mb-4 text-[var(--text-muted)] line-clamp-2">{t.description || '暂无描述'}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">{t.ownerUsername}</span>
              {t.id !== user?.teamId && !joinedIds.has(t.id) ? (
                <Button size="sm" onClick={() => openDetail(t)}>加入</Button>
              ) : (
                <span className="text-xs text-[var(--success)]">已加入</span>
              )}
            </div>
          </GlassCard>
        ))}
      </div>

      {selected && (
        <GlassModal
          open={true}
          onOpenChange={() => setSelected(null)}
          title={selected.teamName}
          description={selected.description || '暂无描述'}
          className="sm:max-w-lg"
        >
          {selected.regions && (
            <div className="space-y-2 mb-6">
              <h4 className="text-sm font-bold text-[var(--text-primary)]">脑区节点分布</h4>
              {selected.regions.map(r => (
                <div key={r.id} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.colorHex }} />
                  <span className="text-xs text-[var(--text-primary)]">{r.name}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setSelected(null)}>取消</Button>
            <Button onClick={() => handleJoin(selected)}>确认加入</Button>
          </div>
        </GlassModal>
      )}
    </PageShell>
  );
};

export default TeamSquare;
```

- [ ] **Step 2: Rewrite JoinTeam page**

Write `frontend/src/pages/JoinTeam.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/shared/GlassCard';
import PageShell from '../components/shared/PageShell';
import { Button } from '@/components/ui/button';
import api from '../services/api';

const JoinTeam = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [joinedIds, setJoinedIds] = useState(new Set());

  useEffect(() => {
    api.get('/teams/public').then(r => setTeams(r.data)).catch(() => {});
  }, []);

  const handleJoin = async (t) => {
    try {
      await api.post(`/teams/${t.id}/join`);
      setJoinedIds(prev => new Set([...prev, t.id]));
      navigate('/');
    } catch (err) {
      console.error('Join failed:', err);
    }
  };

  return (
    <PageShell maxWidth="max-w-4xl">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">选择团队</h2>
      <p className="text-sm text-[var(--text-muted)] mb-6">选择一个团队加入，开始使用 TeamBrain</p>
      <div className="grid grid-cols-2 gap-4">
        {teams.map(t => (
          <GlassCard key={t.id} className="p-6">
            <h3 className="font-bold text-lg mb-2 text-[var(--text-primary)]">{t.teamName}</h3>
            <p className="text-sm mb-4 text-[var(--text-muted)]">{t.description || '暂无描述'}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-xs text-[var(--text-muted)]">
                <span>{t.memberCount || 0} 成员</span>
                <span>{t.projectCount || 0} 项目</span>
              </div>
              {t.id !== user?.teamId && !joinedIds.has(t.id) ? (
                <Button size="sm" onClick={() => handleJoin(t)}>加入团队</Button>
              ) : (
                <span className="text-xs text-[var(--success)]">已加入</span>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </PageShell>
  );
};

export default JoinTeam;
```

- [ ] **Step 3: Build check**

```bash
cd /home/mpt/projects/TeamBrain/frontend && npm run build 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/TeamSquare.jsx frontend/src/pages/JoinTeam.jsx
git commit -m "refactor: rewrite TeamSquare and JoinTeam with GlassCard and GlassModal"
```

---

### Task 10: Refactor Profile page with FormField + Card

**Files:**
- Modify: `frontend/src/pages/Profile.jsx`

- [ ] **Step 1: Rewrite Profile page**

Write `frontend/src/pages/Profile.jsx`:

```jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/shared/GlassCard';
import FormField from '../components/shared/FormField';
import PageShell from '../components/shared/PageShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '../services/api';

const Profile = () => {
  const { user, logout } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/users/${user.id}`, { email, password: password || undefined });
      toast.success('已保存');
    } catch (err) {
      toast.error('保存失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell maxWidth="max-w-lg">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">个人信息</h2>
      <GlassCard className="p-6 space-y-4">
        <FormField label="用户名">
          <Input value={user?.username || ''} disabled className="opacity-50 cursor-not-allowed" />
        </FormField>
        <FormField label="邮箱">
          <Input value={email} onChange={e => setEmail(e.target.value)} />
        </FormField>
        <FormField label="新密码（留空不修改）">
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </FormField>
        <div className="flex justify-between pt-2">
          <Button variant="destructive" onClick={logout}>退出登录</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
        <p className="text-xs text-[var(--text-muted)]">角色：{(user?.roles || []).join(', ')}</p>
      </GlassCard>
    </PageShell>
  );
};

export default Profile;
```

- [ ] **Step 2: Build check**

```bash
cd /home/mpt/projects/TeamBrain/frontend && npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Profile.jsx
git commit -m "refactor: rewrite Profile with GlassCard, FormField, and sonner toast"
```

---

### Task 11: Refactor MyTeamDetail and TeamEditPage — replace inline styles with GlassCard + sonner

**Files:**
- Modify: `frontend/src/pages/MyTeamDetail.jsx`
- Modify: `frontend/src/pages/TeamEditPage.jsx`

- [ ] **Step 1: Update MyTeamDetail Info Tab to use GlassCard + FormField + shadcn Input**

In `frontend/src/pages/MyTeamDetail.jsx`, replace the Info Tab JSX (lines ~449-464) with:

```jsx
{tab === 'info' && (
  <div className="max-w-lg mx-auto p-6 space-y-4">
    <FormField label="团队名称">
      <Input value={teamName} onChange={e => setTeamName(e.target.value)} />
    </FormField>
    <FormField label="描述">
      <Textarea value={teamDesc} onChange={e => setTeamDesc(e.target.value)} rows={4} />
    </FormField>
    <Button onClick={saveInfo}>保存</Button>
  </div>
)}
```

Add imports for `FormField`, `Input`, `Textarea`, `Button` at top of MyTeamDetail.jsx:
```jsx
import FormField from '../components/shared/FormField';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
```

Replace all `alert(...)` calls with `toast.error(...)`:
- `alert('保存失败: ' + ...)` → `toast.error('保存失败: ' + ...)`
- `alert('删除失败: ' + ...)` → `toast.error('删除失败: ' + ...)`
- `alert('至少需要保留一个脑区')` → `toast.error('至少需要保留一个脑区')`

Replace `window.confirm(...)` calls with a GlassModal-based confirmation. Since confirming requires a modal, keep `window.confirm` for now — it will be addressed in a later task.

- [ ] **Step 2: Apply same changes to TeamEditPage.jsx Info Tab**

Make identical changes to TeamEditPage Info Tab JSX (lines ~460-476), plus:
- Add imports for `FormField`, `Input`, `Textarea`, `Button`, `toast`
- Replace all `alert()` calls with `toast.error()`

- [ ] **Step 3: Build check**

```bash
cd /home/mpt/projects/TeamBrain/frontend && npm run build 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/MyTeamDetail.jsx frontend/src/pages/TeamEditPage.jsx
git commit -m "refactor: replace inline styles and alert() in MyTeamDetail and TeamEditPage"
```

---

### Task 12: Refactor Index page loading state + BrainPointCloud modal

**Files:**
- Modify: `frontend/src/pages/Index.jsx`

- [ ] **Step 1: Update Index loading state**

In `frontend/src/pages/Index.jsx`, replace the loading div with:

```jsx
if (brainLoading || teamLoading) {
  return (
    <div className="flex items-center justify-center w-full h-full bg-[var(--bg-deep-space)]">
      <div className="text-[var(--text-muted)] text-lg animate-pulse">加载中...</div>
    </div>
  );
}
```

- [ ] **Step 2: Build check and commit**

```bash
cd /home/mpt/projects/TeamBrain/frontend && npm run build 2>&1 | tail -5
git add frontend/src/pages/Index.jsx
git commit -m "refactor: update Index loading state with Cosmic Glass colors"
```

---

### Task 13: Refactor AdminPage — merge into ProtectedLayout pattern

**Files:**
- Modify: `frontend/src/pages/AdminPage.jsx`
- Modify: `frontend/src/App.jsx`

This is the largest change. The AdminPage currently has its own sidebar layout. We'll replace it with a tab-based sub-navigation under the existing Navbar.

- [ ] **Step 1: Rewrite AdminPage to use tabs instead of sidebar**

Write `frontend/src/pages/AdminPage.jsx`:

This task is large. Instead of showing the full file (900+ lines), here are the key changes:

1. Remove the sidebar and MENU array (lines 11-16, 494-519)
2. Add admin sub-navigation tabs near the top of the page content
3. Wrap each sub-page (Dashboard, UserList, TeamList, TeamDetail, LogList) in consistent GlassCard-based layouts

The admin sub-navigation looks like:

```jsx
const ADMIN_TABS = [
  { key: '', label: '仪表盘' },
  { key: 'users', label: '用户管理' },
  { key: 'teams', label: '团队管理' },
  { key: 'logs', label: '操作日志' },
];
```

And the tab bar:
```jsx
<div className="border-b border-[var(--glass-border)] bg-[var(--bg-deep-space)]">
  <div className="max-w-7xl mx-auto px-6 flex">
    {ADMIN_TABS.map(t => (
      <button key={t.key} onClick={() => navigate(t.key ? `/admin/${t.key}` : '/admin')}
        className={`px-5 py-3 text-sm transition-colors border-b-2 ${
          (t.key === 'teams' && subPath.startsWith('teams/')) || menuKey === t.key
            ? 'border-[var(--accent)] text-[var(--accent)]'
            : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`}>
        {t.label}
      </button>
    ))}
  </div>
</div>
```

**Important:** The full AdminPage is 520 lines. For this plan, the critical changes are:
- Lines 11-16: Replace MENU with ADMIN_TABS (no emoji icons)
- Lines 493-519: Replace sidebar layout with tab bar + content below
- All inline `bg-black bg-opacity-30 backdrop-blur-sm border border-white border-opacity-20 rounded-lg` → use `GlassCard`
- Replace emoji icons in Dashboard rows (👥, 🏢, 📝, 📊) with lucide-react icons or remove
- All `window.confirm()` calls kept as-is for now (will be handled in confirmation modal task)

- [ ] **Step 2: Update App.jsx to wrap AdminPage in ProtectedLayout**

In `frontend/src/App.jsx`, change the admin route from:
```jsx
<Route path="/admin/*" element={<AdminRoute><AdminPage /></AdminRoute>} />
```
to:
```jsx
<Route path="/admin/*" element={<ProtectedLayout><AdminRoute><AdminPage /></AdminRoute></ProtectedLayout>} />
```

This ensures the Navbar is visible on admin pages too.

- [ ] **Step 3: Build check**

```bash
cd /home/mpt/projects/TeamBrain/frontend && npm run build 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/AdminPage.jsx frontend/src/App.jsx
git commit -m "refactor: replace AdminPage sidebar with tab navigation under ProtectedLayout"
```

---

### Task 14: Update Navbar with Cosmic Glass styling

**Files:**
- Modify: `frontend/src/components/Navbar.jsx`

- [ ] **Step 1: Rewrite Navbar with design tokens**

Write `frontend/src/components/Navbar.jsx`:

```jsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const linkClass = cn(
    'px-3 py-2 text-sm transition-colors rounded',
    'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]'
  );

  return (
    <div className="h-14 bg-[var(--glass-bg)] backdrop-blur-[16px] border-b border-[var(--glass-border)] flex items-center justify-between px-6 shrink-0">
      <button onClick={() => navigate('/')} className="text-[var(--text-primary)] font-bold text-lg hover:opacity-80 transition-opacity">
        TeamBrain
      </button>
      <div className="flex items-center space-x-1">
        <button onClick={() => navigate('/my-teams')} className={linkClass}>我的团队</button>
        <button onClick={() => navigate('/teams')} className={linkClass}>团队广场</button>
        <button onClick={() => navigate('/profile')} className={linkClass}>个人信息</button>
        {user?.roles?.includes('ADMIN') && (
          <button onClick={() => navigate('/admin')} className={cn(linkClass, 'border border-[var(--glass-border)] ml-2')}>
            管理
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
```

- [ ] **Step 2: Update ProtectedLayout in App.jsx**

In `frontend/src/App.jsx`, replace:
```jsx
<div className="flex flex-col h-screen bg-black">
```
with:
```jsx
<div className="flex flex-col h-screen bg-[var(--bg-deep-space)]">
```

And the loading state in ProtectedRoute/AdminRoute:
```jsx
<div className="flex items-center justify-center h-screen bg-[var(--bg-deep-space)] text-[var(--text-muted)]">加载中...</div>
```

- [ ] **Step 3: Build check**

```bash
cd /home/mpt/projects/TeamBrain/frontend && npm run build 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Navbar.jsx frontend/src/App.jsx
git commit -m "refactor: update Navbar and ProtectedLayout with Cosmic Glass design tokens"
```

---

### Task 15: Final verification — full build + review

**Files:** No changes, verification only.

- [ ] **Step 1: Run production build**

```bash
cd /home/mpt/projects/TeamBrain && bash build.sh 2>&1 | tail -20
```

Expected: Build succeeds, JAR is created.

- [ ] **Step 2: Grep for remaining old patterns**

```bash
cd /home/mpt/projects/TeamBrain/frontend/src && grep -rn 'bg-black bg-opacity' pages/ components/Navbar.jsx 2>&1
```

Expected: Zero results (all replaced). If any remain, check if they're in intentionally preserved code (like BrainPointCloud 3D).

- [ ] **Step 3: Grep for remaining alert() or window.confirm()**

```bash
cd /home/mpt/projects/TeamBrain/frontend/src && grep -rn 'alert\|window.confirm' pages/ 2>&1
```

Expected: Some `window.confirm()` in AdminPage and MyTeamDetail/TeamEditPage (preserved for now). Zero `alert()` calls (all replaced with `toast.error`).

- [ ] **Step 4: Commit if any straggler fixes were made**

```bash
git status
```

If clean, no commit needed. If fixes were made:

```bash
git add -A
git commit -m "chore: final cleanup of old UI patterns"
```

---

## Summary

| Task | Files | What |
|------|-------|------|
| 1 | `index.css`, `tailwind.config.js` | Cosmic Glass design tokens |
| 2 | `GlassCard.jsx` | Shared glass card component |
| 3 | `GlassModal.jsx` | Shared modal wrapping shadcn Dialog |
| 4 | `FormField.jsx` | Shared form field wrapper |
| 5 | `PageShell.jsx` | Shared page container |
| 6 | `NodeModal`, `RegionModal`, `DeleteRegionModal`, `MyTeamDetail`, `TeamEditPage` | Extract duplicated modals |
| 7 | `LoginPage.jsx` | shadcn Card/Input/Button rewrite |
| 8 | `MyTeams.jsx` | GlassCard + PageShell |
| 9 | `TeamSquare.jsx`, `JoinTeam.jsx` | GlassCard + GlassModal |
| 10 | `Profile.jsx` | GlassCard + sonner toast |
| 11 | `MyTeamDetail.jsx`, `TeamEditPage.jsx` | FormField + toast replace alert |
| 12 | `Index.jsx` | Loading state colors |
| 13 | `AdminPage.jsx`, `App.jsx` | Tab nav + ProtectedLayout |
| 14 | `Navbar.jsx`, `App.jsx` | Glass navbar + layout bg |
| 15 | Verification only | Build + grep check |
