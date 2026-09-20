import { stats } from '@/lib/content';
import CountUp from './CountUp';
import LeafDivider from './LeafDivider';
import Reveal from './Reveal';

export default function StatsBand() {
  return (
    <section
      aria-label="Crimson Security by the numbers"
      className="theme-crimson relative overflow-hidden py-16 lg:py-24"
      style={{ background: 'linear-gradient(115deg, #5a0003 0%, #a10005 42%, #d0180c 100%)' }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(45% 80% at 85% 20%, rgba(255,120,90,0.35), transparent 70%), radial-gradient(40% 70% at 10% 90%, rgba(60,0,2,0.45), transparent 70%)',
        }}
      />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <LeafDivider tone="light" />
        <dl className="grid grid-cols-2 gap-x-6 gap-y-14 py-16 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.08} className="text-center">
              <div className="flex flex-col-reverse items-center">
                <dt className="mt-3 max-w-[14rem] text-xs font-medium uppercase leading-relaxed tracking-[0.2em] text-silver-300 sm:text-sm">
                  {stat.label}
                </dt>
                <dd className="text-crimson-gradient font-display text-5xl font-bold leading-none tabular-nums sm:text-6xl">
                  <CountUp
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    tail={stat.tail}
                  />
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>
        <LeafDivider tone="light" />
      </div>
    </section>
  );
}
