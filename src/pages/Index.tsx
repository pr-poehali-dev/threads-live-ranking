import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import AuthDialog from '@/components/AuthDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Metric = 'likes' | 'reposts' | 'comments';

interface Post {
  id: number;
  author: string;
  handle: string;
  region: string;
  flag: string;
  text: string;
  likes: number;
  reposts: number;
  comments: number;
  minutesAgo: number;
}

const REGIONS = [
  { code: 'all', label: 'Весь мир', flag: '🌍' },
  { code: 'ru', label: 'Россия', flag: '🇷🇺' },
  { code: 'us', label: 'США', flag: '🇺🇸' },
  { code: 'eu', label: 'Европа', flag: '🇪🇺' },
  { code: 'asia', label: 'Азия', flag: '🌏' },
];

const SORTS: { code: Metric; label: string; icon: string }[] = [
  { code: 'likes', label: 'Лайки', icon: 'Heart' },
  { code: 'reposts', label: 'Репосты', icon: 'Repeat2' },
  { code: 'comments', label: 'Комментарии', icon: 'MessageCircle' },
];

const SEED: Post[] = [
  { id: 1, author: 'Алиса Громова', handle: 'alisa.codes', region: 'ru', flag: '🇷🇺', text: 'Только что запустила свой первый pet-проект на выходных. Оказалось, что главное — просто начать, а не ждать идеального момента.', likes: 48200, reposts: 9100, comments: 3400, minutesAgo: 4 },
  { id: 2, author: 'Marcus Lee', handle: 'marcusbuilds', region: 'us', flag: '🇺🇸', text: 'Hot take: most productivity apps make you less productive. The best tool is a single sheet of paper.', likes: 91300, reposts: 21000, comments: 12800, minutesAgo: 2 },
  { id: 3, author: 'Sofia Rossi', handle: 'sofia.design', region: 'eu', flag: '🇮🇹', text: 'Design is not decoration. It is how something works when nobody is explaining it to you.', likes: 67400, reposts: 15600, comments: 5200, minutesAgo: 7 },
  { id: 4, author: 'Кенжи Танака', handle: 'kenji.t', region: 'asia', flag: '🇯🇵', text: 'Утренняя прогулка вместо ленты новостей. Третий день — и мозг будто стал тише. Рекомендую каждому.', likes: 38900, reposts: 7800, comments: 2900, minutesAgo: 11 },
  { id: 5, author: 'Дмитрий Орлов', handle: 'orlov.invest', region: 'ru', flag: '🇷🇺', text: 'Финансовая подушка — это не про деньги. Это про возможность спокойно сказать «нет».', likes: 55100, reposts: 12300, comments: 4100, minutesAgo: 9 },
  { id: 6, author: 'Emma Clark', handle: 'emma.writes', region: 'us', flag: '🇺🇸', text: 'Wrote 500 words today. They were bad. But bad words can be edited — blank pages cannot.', likes: 73600, reposts: 18400, comments: 8700, minutesAgo: 5 },
  { id: 7, author: 'Lukas Berg', handle: 'lukas.eu', region: 'eu', flag: '🇩🇪', text: 'Поезд опоздал на 40 минут — и я прочитал целую главу книги, которую откладывал месяцами. Иногда задержки это подарок.', likes: 29800, reposts: 5600, comments: 1900, minutesAgo: 14 },
  { id: 8, author: 'Mei Chen', handle: 'mei.chen', region: 'asia', flag: '🇸🇬', text: 'Стартап — это марафон, который все почему-то бегут как спринт. Берегите себя, фаундеры.', likes: 61200, reposts: 14100, comments: 6300, minutesAgo: 6 },
];

function jitter(value: number) {
  const delta = Math.round(value * (Math.random() * 0.04));
  return value + delta;
}

const Index = () => {
  const { user, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [region, setRegion] = useState('all');
  const [sort, setSort] = useState<Metric>('likes');
  const [posts, setPosts] = useState<Post[]>(SEED);
  const [saved, setSaved] = useState<number[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(300);

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setPosts((prev) => prev.map((p) => ({
            ...p,
            likes: jitter(p.likes),
            reposts: jitter(p.reposts),
            comments: jitter(p.comments),
            minutesAgo: Math.max(1, p.minutesAgo - 1),
          })));
          return 300;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const visible = useMemo(() => {
    return [...posts]
      .filter((p) => region === 'all' || p.region === region)
      .sort((a, b) => b[sort] - a[sort]);
  }, [posts, region, sort]);

  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '')}K` : `${n}`;

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const toggleSave = (id: number) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setSaved((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border sticky top-0 z-20 bg-background/85 backdrop-blur-md">
        <div className="container max-w-5xl flex items-center justify-between py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-foreground flex items-center justify-center">
              <span className="text-background font-display font-bold text-lg leading-none">@</span>
            </div>
            <span className="font-display font-bold text-xl tracking-tight">Threadly</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
              <span className="w-2 h-2 rounded-full bg-accent ticker-dot" />
              <span className="text-muted-foreground">в эфире</span>
            </div>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card hover:border-foreground/40 transition outline-none">
                  <span className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-semibold text-xs uppercase">
                    {user.name?.[0] || user.email[0]}
                  </span>
                  <span className="hidden sm:inline font-medium max-w-[120px] truncate">{user.name || user.email}</span>
                  <Icon name="ChevronDown" size={15} className="text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-muted-foreground text-xs pointer-events-none">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="cursor-pointer">
                    <Icon name="LogOut" size={15} className="mr-2" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="px-4 py-2 rounded-full bg-foreground text-background font-medium hover:opacity-90 transition"
              >
                Войти
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="container max-w-5xl pt-16 pb-10">
        <p className="text-accent font-medium tracking-wide uppercase text-sm mb-4">Threads · в реальном времени</p>
        <h1 className="font-display font-bold text-5xl sm:text-7xl leading-[0.95] tracking-tight max-w-3xl">
          Самые громкие посты планеты.<br />Прямо сейчас.
        </h1>
        <p className="text-muted-foreground text-lg mt-6 max-w-xl">
          Живой рейтинг популярных постов Threads. Фильтруйте по географии, ранжируйте по реакциям. Обновление каждые 5 минут.
        </p>

        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3">
          <Icon name="RefreshCw" size={18} className="text-accent" />
          <span className="text-sm text-muted-foreground">Следующее обновление через</span>
          <span className="font-display font-semibold text-lg tabular-nums">{mm}:{ss}</span>
        </div>
      </section>

      <section className="container max-w-5xl">
        <div className="flex flex-col gap-4 border-y border-border py-5 sticky top-[73px] z-10 bg-background/85 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground mr-1 w-full sm:w-auto">География</span>
            {REGIONS.map((r) => (
              <button
                key={r.code}
                onClick={() => setRegion(r.code)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition border ${
                  region === r.code
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-card text-foreground border-border hover:border-foreground/40'
                }`}
              >
                <span className="mr-1">{r.flag}</span>{r.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground mr-1 w-full sm:w-auto">Сортировка</span>
            {SORTS.map((s) => (
              <button
                key={s.code}
                onClick={() => setSort(s.code)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition border ${
                  sort === s.code
                    ? 'bg-accent text-accent-foreground border-accent'
                    : 'bg-card text-foreground border-border hover:border-foreground/40'
                }`}
              >
                <Icon name={s.icon} size={15} />{s.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container max-w-5xl py-10">
        <div className="grid gap-4">
          {visible.map((p, i) => (
            <article
              key={p.id}
              className="animate-rise group relative rounded-2xl border border-border bg-card p-6 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] transition-shadow"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                <span className="font-display font-bold text-3xl text-muted-foreground/40 w-10 shrink-0 tabular-nums leading-none pt-1">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-semibold">{p.author}</span>
                    <span className="text-muted-foreground text-sm">@{p.handle}</span>
                    <span className="text-muted-foreground text-sm">· {p.minutesAgo} мин</span>
                    <span className="ml-auto text-lg" title={p.region}>{p.flag}</span>
                  </div>
                  <p className="text-foreground/90 leading-relaxed">{p.text}</p>
                  <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                    <span className={`flex items-center gap-1.5 ${sort === 'likes' ? 'text-accent font-semibold' : ''}`}>
                      <Icon name="Heart" size={16} />{fmt(p.likes)}
                    </span>
                    <span className={`flex items-center gap-1.5 ${sort === 'reposts' ? 'text-accent font-semibold' : ''}`}>
                      <Icon name="Repeat2" size={16} />{fmt(p.reposts)}
                    </span>
                    <span className={`flex items-center gap-1.5 ${sort === 'comments' ? 'text-accent font-semibold' : ''}`}>
                      <Icon name="MessageCircle" size={16} />{fmt(p.comments)}
                    </span>
                    <button
                      onClick={() => toggleSave(p.id)}
                      className="ml-auto flex items-center gap-1.5 hover:text-foreground transition"
                    >
                      <Icon name={saved.includes(p.id) ? 'Bookmark' : 'BookmarkPlus'} size={16} className={saved.includes(p.id) ? 'text-accent' : ''} />
                      {saved.includes(p.id) ? 'В избранном' : 'Сохранить'}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}

          {visible.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <Icon name="SearchX" size={40} className="mx-auto mb-3 opacity-50" />
              Постов из этого региона пока нет
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-border mt-10">
        <div className="container max-w-5xl py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-foreground flex items-center justify-center">
              <span className="text-background font-display font-bold text-xs leading-none">@</span>
            </div>
            <span className="font-display font-semibold text-foreground">Threadly</span>
          </div>
          <span>Рейтинг обновляется автоматически каждые 5 минут</span>
        </div>
      </footer>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
};

export default Index;