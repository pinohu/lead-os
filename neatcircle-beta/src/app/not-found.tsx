import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 text-4xl font-bold text-white">404</h1>
      <p className="mb-6 max-w-md text-slate-300">The page you are looking for does not exist.</p>
      <Link
        href="/"
        className="rounded-lg bg-cyan-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
      >
        Return home
      </Link>
    </div>
  );
}
