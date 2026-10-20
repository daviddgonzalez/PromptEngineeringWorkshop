const stats = [
  { label: 'Revenue', value: '$48.2k', change: '+12.4%', up: true },
  { label: 'Active users', value: '3,912', change: '+4.1%', up: true },
  { label: 'Churn', value: '2.3%', change: '-0.6%', up: false },
  { label: 'Avg. session', value: '6m 41s', change: '+18s', up: true },
];

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 px-16 py-12 font-sans text-zinc-100">
      <p className="text-sm uppercase tracking-widest text-zinc-500">Dashboard</p>
      <h1 className="mt-2 text-4xl font-semibold">Good morning</h1>
      <div className="mt-10 grid grid-cols-4 gap-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 ring-1 ring-white/5">
            <p className="text-sm text-zinc-400">{s.label}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight">{s.value}</p>
            <p className={`mt-2 text-sm font-medium ${s.up ? 'text-lime-400' : 'text-rose-400'}`}>{s.change}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 h-64 rounded-2xl bg-gradient-to-t from-cyan-500/20 to-transparent ring-1 ring-cyan-400/30" />
    </div>
  );
}
