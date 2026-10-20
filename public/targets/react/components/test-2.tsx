import { useState } from 'react';

const tabs = ['Overview', 'Activity', 'Settings', 'Billing'] as const;

export default function App() {
  const [active] = useState<(typeof tabs)[number]>('Activity');
  const events = [
    { who: 'Maya', what: 'merged pull request #482', when: '2h ago' },
    { who: 'Jordan', what: 'opened issue "Login loop on Safari"', when: '5h ago' },
    { who: 'Sam', what: 'deployed v2.4.0 to production', when: 'Yesterday' },
    { who: 'Priya', what: 'invited 3 new members', when: '2 days ago' },
  ];
  return (
    <div className="min-h-screen bg-white px-20 py-12 font-sans">
      <h1 className="text-2xl font-bold text-gray-900">Acme workspace</h1>
      <nav className="mt-6 flex gap-8 border-b border-gray-200">
        {tabs.map((tab) => (
          <span
            key={tab}
            className={
              tab === active
                ? '-mb-px border-b-2 border-violet-600 pb-3 font-semibold text-violet-700'
                : 'pb-3 text-gray-500'
            }
          >
            {tab}
          </span>
        ))}
      </nav>
      <ul className="mt-6 divide-y divide-gray-100">
        {events.map((e) => (
          <li key={e.what} className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 font-semibold text-violet-700">
              {e.who[0]}
            </div>
            <p className="flex-1 text-gray-700">
              <span className="font-semibold text-gray-900">{e.who}</span> {e.what}
            </p>
            <span className="text-sm text-gray-400">{e.when}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
