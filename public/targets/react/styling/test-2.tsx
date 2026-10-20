export default function App() {
  return (
    <div className="min-h-screen bg-stone-50 px-32 py-16 font-serif text-stone-900">
      <p className="font-sans text-xs font-bold uppercase tracking-[0.25em] text-orange-700">Field notes</p>
      <h1 className="mt-4 text-6xl font-black leading-tight">The quiet art of whitespace</h1>
      <h2 className="mt-8 text-3xl font-semibold text-stone-700">Why less on the page says more</h2>
      <p className="mt-6 max-w-2xl font-sans text-lg leading-8 text-stone-700">
        Good typography is mostly invisible. A comfortable measure, generous line height and a clear
        hierarchy let readers glide through text without noticing the design at all.
      </p>
      <p className="mt-4 max-w-2xl font-sans text-sm leading-6 text-stone-500">
        Set body copy between 45 and 75 characters per line, and let headings carry contrast in weight
        rather than colour. <a className="font-semibold text-orange-700 underline decoration-2 underline-offset-4">Read the full guide</a>
      </p>
      <blockquote className="mt-10 max-w-2xl border-l-4 border-orange-600 pl-6 text-2xl italic text-stone-800">
        “Typography is what language looks like.”
      </blockquote>
    </div>
  );
}
