import AuthShell from "../../components/AuthShell";

export default async function VerifiedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const ok = status === "ok";

  return (
    <AuthShell>
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md border border-gray-100 p-8 text-center space-y-4">
        <span
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold ${
            ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {ok ? "✓" : "!"}
        </span>

        <h1 className="text-xl font-semibold text-navy-900">
          {ok ? "Email verified" : "Link not valid"}
        </h1>

        <p className="text-sm text-gray-600">
          {ok
            ? "Your account is ready. You can now log in."
            : "This verification link is invalid or has expired. Please contact the accounts office."}
        </p>

        <a
          href="/login"
          className="block w-full bg-brand hover:bg-brand-dark text-white rounded-lg py-2.5 font-semibold transition-colors"
        >
          Go to login
        </a>
      </div>
    </AuthShell>
  );
}