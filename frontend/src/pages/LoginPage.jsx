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
