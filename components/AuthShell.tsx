export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-navy-900 border-b-4 border-accent">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-navy-900 font-bold">
            FP
          </span>
          <div className="leading-tight">
            <p className="text-white font-semibold">MUET Fee Portal</p>
            <p className="text-xs text-blue-200">Fee challans and clearance</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      <footer className="text-center text-xs text-gray-500 py-4">
        Demo project. Not an official MUET portal.
      </footer>
    </div>
  );
}