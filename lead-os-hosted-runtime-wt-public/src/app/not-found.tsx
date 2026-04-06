import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 text-4xl font-bold">404</h1>
      <p className="mb-6 max-w-md text-gray-600">The page you are looking for does not exist.</p>
      <Link
        href="/"
        className="rounded-lg bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-500"
      >
        Return home
      </Link>
    </div>
  );
}
