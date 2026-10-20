export default function App() {
  return (
    <div className="relative h-screen bg-gray-100 font-sans">
      <div className="p-12">
        <div className="h-8 w-48 rounded bg-gray-300" />
        <div className="mt-6 grid grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-40 rounded-lg bg-white" />
          ))}
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
        <div className="w-[440px] rounded-2xl bg-white p-8 shadow-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">!</div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">Delete project?</h2>
          <p className="mt-2 text-gray-600">
            This permanently removes the project and all of its files. This action cannot be undone.
          </p>
          <div className="mt-8 flex justify-end gap-3">
            <span className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700">Cancel</span>
            <span className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white">Delete</span>
          </div>
        </div>
      </div>
    </div>
  );
}
