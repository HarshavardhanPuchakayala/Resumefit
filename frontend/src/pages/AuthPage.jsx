import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function AuthPage({ mode }) {
  const { login, signup } = useAuth();
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await (isSignup ? signup : login)(email.trim(), password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const input =
    "mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-6"
    >
      <h1 className="text-xl font-bold">
        {isSignup ? "Create your account" : "Log in to ResumeFit"}
      </h1>

      <label className="block text-sm font-medium text-slate-700">
        Email
        <input
          type="email"
          required
          className={input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Password
        <input
          type="password"
          required
          minLength={isSignup ? 8 : undefined}
          maxLength={128}
          className={input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {isSignup && (
          <span className="mt-1 block text-xs font-normal text-slate-500">
            At least 8 characters.
          </span>
        )}
      </label>

      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      <button
        disabled={busy}
        className="w-full rounded bg-slate-900 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {busy ? "Please wait..." : isSignup ? "Sign up" : "Log in"}
      </button>

      <p className="text-center text-sm text-slate-600">
        {isSignup ? (
          <>Already have an account? <Link className="underline" to="/login">Log in</Link></>
        ) : (
          <>New here? <Link className="underline" to="/signup">Create an account</Link></>
        )}
      </p>
    </form>
  );
}