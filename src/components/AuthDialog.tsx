import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setEmail('');
    setPassword('');
    setName('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        toast({ title: 'С возвращением!', description: 'Вы успешно вошли.' });
      } else {
        await register(email, password, name);
        toast({ title: 'Аккаунт создан', description: 'Добро пожаловать в Threadly!' });
      }
      reset();
      onOpenChange(false);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Не получилось',
        description: err instanceof Error ? err.message : 'Попробуйте ещё раз',
      });
    } finally {
      setBusy(false);
    }
  };

  const soon = (provider: string) =>
    toast({
      title: `${provider} скоро`,
      description: 'Этот способ входа подключим в ближайшее время.',
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {mode === 'login' ? 'Вход в Threadly' : 'Создать аккаунт'}
          </DialogTitle>
          <DialogDescription>
            Сохраняйте избранные посты и настройки рейтинга.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2.5 mt-2">
          <button
            onClick={() => soon('Threads')}
            className="flex items-center justify-center gap-2.5 w-full py-2.5 rounded-xl border border-border bg-card font-medium hover:bg-secondary transition"
          >
            <Icon name="AtSign" size={18} />
            Войти через Threads
          </button>
          <button
            onClick={() => soon('Telegram')}
            className="flex items-center justify-center gap-2.5 w-full py-2.5 rounded-xl border border-border bg-card font-medium hover:bg-secondary transition"
          >
            <Icon name="Send" size={18} />
            Войти через Telegram
          </button>
        </div>

        <div className="flex items-center gap-3 my-1">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground uppercase tracking-wide">или по почте</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="grid gap-3">
          {mode === 'register' && (
            <Input
              placeholder="Имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Пароль (от 6 символов)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy && <Icon name="Loader2" size={16} className="animate-spin" />}
            {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === 'login' ? 'Ещё нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-accent font-medium hover:underline"
          >
            {mode === 'login' ? 'Создать' : 'Войти'}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
