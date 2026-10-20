export default function App() {
  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sky-400 via-indigo-500 to-fuchsia-500 font-sans">
      <div className="absolute -left-20 top-16 h-80 w-80 rounded-full bg-yellow-300/60 blur-3xl" />
      <div className="absolute -bottom-24 right-24 h-96 w-96 rounded-full bg-pink-400/60 blur-3xl" />
      <div className="relative w-[480px] rounded-3xl border border-white/40 bg-white/20 p-10 text-white shadow-2xl backdrop-blur-xl">
        <p className="text-sm font-medium uppercase tracking-wider text-white/80">Membership</p>
        <h1 className="mt-2 text-4xl font-bold">Aurora Pass</h1>
        <p className="mt-3 text-white/80">Unlimited access to every studio, every day.</p>
        <div className="mt-8 flex items-end justify-between">
          <p className="text-5xl font-extrabold">
            $29<span className="text-lg font-medium text-white/70">/mo</span>
          </p>
          <span className="rounded-full bg-white px-6 py-3 font-semibold text-indigo-600 shadow-lg">Join now</span>
        </div>
      </div>
    </div>
  );
}
