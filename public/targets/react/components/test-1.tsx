type Project = { name: string; owner: string; status: 'Active' | 'Paused' | 'Done'; progress: number };

const projects: Project[] = [
  { name: 'Website redesign', owner: 'Design', status: 'Active', progress: 72 },
  { name: 'Mobile app', owner: 'Engineering', status: 'Active', progress: 45 },
  { name: 'Q3 campaign', owner: 'Marketing', status: 'Paused', progress: 30 },
  { name: 'Billing migration', owner: 'Engineering', status: 'Done', progress: 100 },
  { name: 'Help centre', owner: 'Support', status: 'Active', progress: 58 },
  { name: 'Brand refresh', owner: 'Design', status: 'Done', progress: 100 },
];

const badge: Record<Project['status'], string> = {
  Active: 'bg-emerald-100 text-emerald-700',
  Paused: 'bg-amber-100 text-amber-700',
  Done: 'bg-slate-200 text-slate-700',
};

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 px-16 py-12 font-sans">
      <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
      <p className="mt-1 text-slate-500">6 projects across 4 teams</p>
      <div className="mt-8 grid grid-cols-3 gap-6">
        {projects.map((p) => (
          <div key={p.name} className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{p.name}</h2>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge[p.status]}`}>{p.status}</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">{p.owner}</p>
            <div className="mt-6 h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${p.progress}%` }} />
            </div>
            <p className="mt-2 text-right text-sm font-medium text-slate-600">{p.progress}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
