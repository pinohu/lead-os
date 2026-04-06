import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy text-white px-4">
      <h1 className="text-6xl font-bold text-cyan mb-4">404</h1>
      <p className="text-lg text-slate-300 mb-8">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="bg-cyan hover:bg-cyan-dark text-white font-semibold px-8 py-3 rounded-lg transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
