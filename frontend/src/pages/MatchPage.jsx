import { useState } from "react";
import { api, download } from "../api";

const MIN_JD = 30;

function Chip({ tone, children }) {
  const colors =
    tone === "good" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800";
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${colors}`}>{children}</span>
  );
}

const btn =
  "rounded px-4 py-2 text-sm font-medium disabled:opacity-50";

export default function MatchPage() {
  const [jd, setJd] = useState("");
  const [match, setMatch] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [provider, setProvider] = useState("");
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const ready = jd.trim().length >= MIN_JD;

  async function run(name, task) {
    setBusy(name);
    setError("");
    setMessage("");
    try {
      await task();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  const checkMatch = () =>
    run("match", async () => {
      setMatch(await api("/match", { method: "POST", body: { job_description: jd } }));
    });

  const showPreview = () =>
    run("preview", async () => {
      const data = await api("/ai/suggest", {
        method: "POST",
        body: { job_description: jd, preview_only: true },
      });
      setPreview(data.prompt_sent_to_ai);
    });

  const getSuggestions = () =>
    run("ai", async () => {
      const data = await api("/ai/suggest", {
        method: "POST",
        body: { job_description: jd },
      });
      setMatch(data.match);
      setSuggestions(data.suggestions);
      setProvider(data.provider);
      if (data.suggestions.length === 0) {
        setMessage("The AI had no safe suggestions for this job.");
      }
    });

  const accept = (s) =>
    run("apply", async () => {
      await api("/ai/apply", {
        method: "POST",
        body: {
          section: s.section,
          item_index: s.item_index,
          bullet_index: s.bullet_index,
          expected_original: s.original,
          new_text: s.suggested,
        },
      });
      setSuggestions((list) => list.filter((x) => x.id !== s.id));
      setMessage("Applied to your resume. Click Check match to see the new score.");
    });

  const reject = (s) => setSuggestions((list) => list.filter((x) => x.id !== s.id));

  const getFile = (format) =>
    run("download", () => download(`/export/${format}`, `resume.${format}`));

  const scoreColor =
    match && (match.score >= 70 ? "bg-green-500" : match.score >= 40 ? "bg-amber-500" : "bg-red-500");

  return (
    <>
      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Paste the job description</h2>
        <textarea
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          rows={8}
          maxLength={8000}
          placeholder="Paste the full job description here (at least 30 characters)..."
          value={jd}
          onChange={(e) => setJd(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button className={`${btn} bg-slate-900 text-white`} disabled={!ready || busy} onClick={checkMatch}>
            {busy === "match" ? "Checking..." : "Check match"}
          </button>
          <button className={`${btn} border border-slate-300 bg-white`} disabled={!ready || busy} onClick={getSuggestions}>
            {busy === "ai" ? "Asking the AI..." : "Get AI suggestions"}
          </button>
          <button className={`${btn} border border-slate-300 bg-white`} disabled={!ready || busy} onClick={showPreview}>
            Show what the AI sees
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Check match uses no AI. AI suggestions are limited to 10 per hour.
        </p>
      </section>

      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded bg-green-50 p-3 text-sm text-green-800">{message}</p>}

      {preview && (
        <section className="space-y-2 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Exactly what the AI receives</h2>
          <p className="text-sm text-slate-500">
            Check it yourself: your name, phone, email and links are not in this text.
          </p>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded bg-slate-900 p-3 text-xs text-slate-100">
            {preview}
          </pre>
        </section>
      )}

      {match && (
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Match score</h2>
            <span className="text-3xl font-bold">{match.score}/100</span>
          </div>
          <div className="h-3 overflow-hidden rounded bg-slate-200">
            <div className={`h-3 ${scoreColor}`} style={{ width: `${match.score}%` }} />
          </div>
          {match.note && <p className="text-sm text-slate-600">{match.note}</p>}

          <div>
            <h3 className="mb-2 text-sm font-semibold">In your resume ({match.matched.length})</h3>
            <div className="flex flex-wrap gap-2">
              {match.matched.length === 0 && <span className="text-sm text-slate-500">None yet</span>}
              {match.matched.map((s) => <Chip key={s} tone="good">{s}</Chip>)}
            </div>
          </div>

          <div>
            <h3 className="mb-1 text-sm font-semibold">Missing ({match.missing.length})</h3>
            <p className="mb-2 text-xs text-slate-500">
              Learn these first. Add a skill to your resume only if you really know it.
            </p>
            <div className="flex flex-wrap gap-2">
              {match.missing.length === 0 && <span className="text-sm text-slate-500">Nothing missing</span>}
              {match.missing.map((s) => <Chip key={s} tone="warn">{s}</Chip>)}
            </div>
          </div>

          {match.suggestions.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Tips</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                {match.suggestions.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>
          )}
        </section>
      )}

      {suggestions && suggestions.length > 0 && (
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
          <div>
            <h2 className="text-lg font-semibold">AI suggestions</h2>
            <p className="text-xs text-slate-500">
              Nothing changes until you press Accept. Answered by {provider}.
            </p>
          </div>
          {suggestions.map((s) => (
            <div key={s.id} className="space-y-2 rounded border border-slate-200 p-4 text-sm">
              <p className="text-slate-500 line-through">{s.original}</p>
              <p className="font-medium">{s.suggested}</p>
              {s.reason && <p className="text-xs text-slate-500">Why: {s.reason}</p>}
              {s.added_skills.length > 0 && (
                <p className="rounded bg-amber-50 p-2 text-xs text-amber-800">
                  Confirm you really used: {s.added_skills.join(", ")}. Reject this suggestion if not.
                </p>
              )}
              <div className="flex gap-2">
                <button className={`${btn} bg-slate-900 text-white`} disabled={!!busy} onClick={() => accept(s)}>
                  Accept
                </button>
                <button className={`${btn} border border-slate-300`} disabled={!!busy} onClick={() => reject(s)}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Download your resume</h2>
        <div className="flex gap-2">
          <button className={`${btn} bg-slate-900 text-white`} disabled={!!busy} onClick={() => getFile("pdf")}>
            Download PDF
          </button>
          <button className={`${btn} border border-slate-300 bg-white`} disabled={!!busy} onClick={() => getFile("docx")}>
            Download DOCX
          </button>
        </div>
      </section>
    </>
  );
}