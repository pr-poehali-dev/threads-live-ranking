import { useCallback, useEffect, useMemo, useState } from 'react';
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
type Period = '5min' | 'day' | 'week' | 'halfyear' | 'year';

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
  period: Period;
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

const PERIODS: { code: Period; label: string }[] = [
  { code: '5min', label: '5 минут' },
  { code: 'day', label: 'День' },
  { code: 'week', label: 'Неделя' },
  { code: 'halfyear', label: 'Полгода' },
  { code: 'year', label: 'Год' },
];

const NAMES: { author: string; handle: string; region: string; flag: string }[] = [
  { author: 'Алиса Громова', handle: 'alisa.codes', region: 'ru', flag: '🇷🇺' },
  { author: 'Marcus Lee', handle: 'marcusbuilds', region: 'us', flag: '🇺🇸' },
  { author: 'Sofia Rossi', handle: 'sofia.design', region: 'eu', flag: '🇮🇹' },
  { author: 'Кенжи Танака', handle: 'kenji.t', region: 'asia', flag: '🇯🇵' },
  { author: 'Дмитрий Орлов', handle: 'orlov.invest', region: 'ru', flag: '🇷🇺' },
  { author: 'Emma Clark', handle: 'emma.writes', region: 'us', flag: '🇺🇸' },
  { author: 'Lukas Berg', handle: 'lukas.eu', region: 'eu', flag: '🇩🇪' },
  { author: 'Mei Chen', handle: 'mei.chen', region: 'asia', flag: '🇸🇬' },
  { author: 'Карина Соколова', handle: 'karina.s', region: 'ru', flag: '🇷🇺' },
  { author: 'James Wright', handle: 'jwright', region: 'us', flag: '🇺🇸' },
  { author: 'Олег Петров', handle: 'oleg.dev', region: 'ru', flag: '🇷🇺' },
  { author: 'Nina Kovač', handle: 'nina.k', region: 'eu', flag: '🇭🇷' },
  { author: 'Хёна Ким', handle: 'hyena.kim', region: 'asia', flag: '🇰🇷' },
  { author: 'Olivia Park', handle: 'olivia.p', region: 'us', flag: '🇺🇸' },
  { author: 'Антон Белов', handle: 'belov.photo', region: 'ru', flag: '🇷🇺' },
  { author: 'Pablo García', handle: 'pablo.g', region: 'eu', flag: '🇪🇸' },
  { author: 'Aarav Sharma', handle: 'aarav.s', region: 'asia', flag: '🇮🇳' },
  { author: 'Мария Зайцева', handle: 'masha.z', region: 'ru', flag: '🇷🇺' },
  { author: 'Tom Baker', handle: 'tombakes', region: 'us', flag: '🇺🇸' },
  { author: 'Léa Dubois', handle: 'lea.d', region: 'eu', flag: '🇫🇷' },
];

const TEXTS = [
  'Только что запустила свой первый pet-проект на выходных. Главное — просто начать, а не ждать идеального момента.',
  'Hot take: most productivity apps make you less productive. The best tool is a single sheet of paper.',
  'Design is not decoration. It is how something works when nobody is explaining it to you.',
  'Утренняя прогулка вместо ленты новостей. Третий день — и мозг будто стал тише.',
  'Финансовая подушка — это не про деньги. Это про возможность спокойно сказать «нет».',
  'Wrote 500 words today. They were bad. But bad words can be edited — blank pages cannot.',
  'Поезд опоздал на 40 минут — и я прочитал целую главу книги. Иногда задержки это подарок.',
  'Стартап — это марафон, который все почему-то бегут как спринт. Берегите себя, фаундеры.',
  'Перестала проверять почту по утрам. Продуктивность выросла, тревожность упала.',
  'The hardest part of any project is deciding it is good enough to ship.',
  'Завёл привычку записывать одну хорошую вещь за день. Через месяц перечитал — будто другая жизнь.',
  'Минимализм — это не про пустые полки. Это про то, чтобы каждая вещь имела смысл.',
  '집중력은 근육과 같다. 매일 조금씩 훈련하면 강해진다.',
  'Stopped multitasking for a week. Turns out I was just doing many things badly at once.',
  'Снял на плёнку целое лето. Проявил только сейчас — и каждый кадр как маленькая машина времени.',
  'La mejor inversión no es en cripto, es en aprender a decir que no.',
  'Read 20 pages before opening any app. Small rule, huge difference.',
  'Уволилась с работы мечты, чтобы построить свою. Страшно, но впервые за годы — честно.',
  'Cooking is just chemistry you are allowed to eat. Embrace the experiments.',
  'Le silence du matin vaut mille notifications. Essayez, juste une semaine.',
];

const SEED: Post[] = Array.from({ length: 20 }, (_, i) => {
  const person = NAMES[i];
  const period = PERIODS[i % PERIODS.length].code;
  const base = 18000 + Math.round(Math.random() * 90000);
  return {
    id: i + 1,
    author: person.author,
    handle: person.handle,
    region: person.region,
    flag: person.flag,
    text: TEXTS[i],
    likes: base,
    reposts: Math.round(base * (0.15 + Math.random() * 0.2)),
    comments: Math.round(base * (0.05 + Math.random() * 0.12)),
    minutesAgo: 1 + Math.round(Math.random() * 14),
    period,
  };
});

const avatarUrl = (handle: string) =>
  `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(handle)}&backgroundColor=ffd5a6,b6e3f4,c0aede,d1d4f9,ffdfbf`;

function jitter(value: number) {
  const delta = Math.round(value * (Math.random() * 0.24 - 0.06));
  return Math.max(1000, value + delta);
}

const Index = () => {
  const { user, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [region, setRegion] = useState('all');
  const [sort, setSort] = useState<Metric>('likes');
  const [period, setPeriod] = useState<Period>('5min');
  const [posts, setPosts] = useState<Post[]>(SEED);
  const [saved, setSaved] = useState<number[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date>(new Date());

  const refresh = useCallback(() => {
    setRefreshing(true);
    setPosts((prev) =>
      prev.map((p) => ({
        ...p,
        likes: jitter(p.likes),
        reposts: jitter(p.reposts),
        comments: jitter(p.comments),
        minutesAgo: Math.max(1, Math.round(1 + Math.random() * 14)),
      })),
    );
    setUpdatedAt(new Date());
    setSecondsLeft(300);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          refresh();
          return 300;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [refresh]);

  const visible = useMemo(() => {
    return [...posts]
      .filter((p) => region === 'all' || p.region === region)
      .filter((p) => period === '5min' || p.period === period)
      .sort((a, b) => b[sort] - a[sort]);
  }, [posts, region, sort, period]);

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

        {period === '5min' ? (
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3">
              <Icon name="RefreshCw" size={18} className={`text-accent ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm text-muted-foreground">Следующее обновление через</span>
              <span className="font-display font-semibold text-lg tabular-nums">{mm}:{ss}</span>
            </div>
            <button
              onClick={refresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-5 py-3 font-medium hover:opacity-90 transition disabled:opacity-60"
            >
              <Icon name="RotateCw" size={18} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Обновляем…' : 'Обновить сейчас'}
            </button>
          </div>
        ) : (
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3">
            <Icon name="TrendingUp" size={18} className="text-accent" />
            <span className="text-sm text-muted-foreground">
              Рейтинг за период: <span className="font-semibold text-foreground">{PERIODS.find((x) => x.code === period)?.label}</span>
            </span>
          </div>
        )}
      </section>

      <section className="container max-w-5xl">
        <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-secondary">
          {PERIODS.map((pr) => (
            <button
              key={pr.code}
              onClick={() => setPeriod(pr.code)}
              className={`flex-1 min-w-[80px] px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                period === pr.code
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {pr.code === '5min' && <Icon name="Radio" size={14} className="inline mr-1.5 -mt-0.5" />}
              {pr.label}
            </button>
          ))}
        </div>
      </section>

      <section className="container max-w-5xl mt-4">
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
                <span className="font-display font-bold text-3xl text-muted-foreground/40 w-8 shrink-0 tabular-nums leading-none pt-1">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <img
                  src={avatarUrl(p.handle)}
                  alt={p.author}
                  loading="lazy"
                  className="w-11 h-11 rounded-full shrink-0 bg-secondary object-cover ring-1 ring-border"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-semibold">{p.author}</span>
                    <span className="text-muted-foreground text-sm">@{p.handle}</span>
                    {period === '5min' && (
                      <span className="text-muted-foreground text-sm">· {p.minutesAgo} мин</span>
                    )}
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
              За этот период и регион постов пока нет
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