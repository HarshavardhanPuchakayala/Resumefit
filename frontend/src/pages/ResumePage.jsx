import { useEffect, useState } from "react";
import { api } from "../api";

const EMPTY = {
  contact: { full_name: "", phone: "", email: "", location: "", linkedin: "", github: "", portfolio: "" },
  content: { headline: "", summary: "", skills: [], experience: [], projects: [], education: [] },
};

const blank = {
  skill: () => ({ category: "", items: [] }),
  job: () => ({ role: "", company: "", location: "", start_date: "", end_date: "", bullets: [""] }),
  project: () => ({ name: "", start_date: "", end_date: "", tech_stack: [], bullets: [""] }),
  education: () => ({ degree: "", institution: "", location: "", start_year: "", end_year: "" }),
};

const contactFields = [
  ["full_name", "Full name", 100],
  ["phone", "Phone", 20],
  ["email", "Email", 255],
  ["location", "Location", 100],
  ["linkedin", "LinkedIn", 255],
  ["github", "GitHub", 255],
  ["portfolio", "Portfolio", 255],
];

const getIn = (obj, path) => path.reduce((node, key) => node[key], obj);

function setIn(obj, path, value) {
  const copy = structuredClone(obj);
  let node = copy;
  for (const key of path.slice(0, -1)) node = node[key];
  node[path[path.length - 1]] = value;
  return copy;
}

const inputClass =
  "mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";

function Field({ label, value, onChange, max, area = false, placeholder }) {
  const Tag = area ? "textarea" : "input";
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <Tag
        className={inputClass}
        value={value}
        maxLength={max}
        rows={area ? 4 : undefined}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function CsvField({ label, items, onChange, maxItems, placeholder }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        className={inputClass}
        defaultValue={items.join(", ")}
        placeholder={placeholder}
        onBlur={(e) =>
          onChange(
            e.target.value
              .split(",")
              .map((s) => s.trim().slice(0, 200))
              .filter(Boolean)
              .slice(0, maxItems)
          )
        }
      />
    </label>
  );
}

function BulletList({ bullets, onChange, max = 12 }) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-slate-700">Bullet points</span>
      {bullets.map((bullet, i) => (
        <div key={i} className="flex gap-2">
          <textarea
            className={`${inputClass} mt-0`}
            rows={2}
            maxLength={400}
            value={bullet}
            onChange={(e) =>
              onChange(bullets.map((b, j) => (j === i ? e.target.value : b)))
            }
          />
          <button
            type="button"
            className="text-sm text-red-600"
            onClick={() => onChange(bullets.filter((_, j) => j !== i))}
          >
            Remove
          </button>
        </div>
      ))}
      {bullets.length < max && (
        <button
          type="button"
          className="text-sm font-medium text-slate-700 underline"
          onClick={() => onChange([...bullets, ""])}
        >
          + Add bullet
        </button>
      )}
    </div>
  );
}

function Section({ title, hint, children }) {
  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {hint && <p className="text-sm text-slate-500">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

const AddButton = ({ onClick, children }) => (
  <button type="button" onClick={onClick} className="text-sm font-medium text-slate-700 underline">
    {children}
  </button>
);

const RemoveButton = ({ onClick }) => (
  <button type="button" onClick={onClick} className="text-sm text-red-600">
    Remove
  </button>
);

export default function ResumePage() {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  useEffect(() => {
    api("/resume")
      .then((saved) => {
        setData(saved);
        setVersion((v) => v + 1);
      })
      .catch((err) => setStatus({ type: "error", text: err.message }))
      .finally(() => setLoading(false));
  }, []);

  const set = (path) => (value) => setData((prev) => setIn(prev, path, value));
  const addItem = (path, item) =>
    setData((prev) => setIn(prev, path, [...getIn(prev, path), item]));
  const removeItem = (path, index) => {
    setData((prev) =>
      setIn(prev, path, getIn(prev, path).filter((_, i) => i !== index))
    );
    setVersion((v) => v + 1);
  };

  async function save() {
    setSaving(true);
    setStatus({ type: "", text: "" });
    try {
      const clean = structuredClone(data);
      for (const key of ["experience", "projects"]) {
        for (const item of clean.content[key]) {
          item.bullets = item.bullets.map((b) => b.trim()).filter(Boolean);
        }
      }
      await api("/resume", { method: "PUT", body: clean });
      setStatus({ type: "ok", text: "Saved" });
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-slate-500">Loading your resume...</p>;

  const { contact, content } = data;

  return (
    <>
      <Section
        title="Contact details"
        hint="Your name, phone, email and links are stored separately and never sent to the AI."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {contactFields.map(([key, label, max]) => (
            <Field key={key} label={label} max={max} value={contact[key]} onChange={set(["contact", key])} />
          ))}
        </div>
      </Section>

      <Section title="Headline and summary">
        <Field label="Headline" max={100} placeholder="Full Stack Developer" value={content.headline} onChange={set(["content", "headline"])} />
        <Field label="Professional summary" area max={800} value={content.summary} onChange={set(["content", "summary"])} />
      </Section>

      <Section title="Technical skills" hint="Group your skills, for example Backend or Databases.">
        {content.skills.map((group, i) => (
          <div key={i} className="grid gap-3 rounded border border-slate-200 p-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
            <Field label="Category" max={50} value={group.category} onChange={set(["content", "skills", i, "category"])} />
            <CsvField
              key={`${version}-skills-${i}`}
              label="Skills (comma separated)"
              items={group.items}
              maxItems={25}
              onChange={set(["content", "skills", i, "items"])}
            />
            <RemoveButton onClick={() => removeItem(["content", "skills"], i)} />
          </div>
        ))}
        {content.skills.length < 12 && (
          <AddButton onClick={() => addItem(["content", "skills"], blank.skill())}>+ Add skill group</AddButton>
        )}
      </Section>

      <Section title="Professional experience">
        {content.experience.map((job, i) => {
          const base = ["content", "experience", i];
          return (
            <div key={i} className="space-y-3 rounded border border-slate-200 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Role" max={100} value={job.role} onChange={set([...base, "role"])} />
                <Field label="Company" max={100} value={job.company} onChange={set([...base, "company"])} />
                <Field label="Location" max={100} value={job.location} onChange={set([...base, "location"])} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Start date" max={20} placeholder="July 2024" value={job.start_date} onChange={set([...base, "start_date"])} />
                  <Field label="End date" max={20} placeholder="Present" value={job.end_date} onChange={set([...base, "end_date"])} />
                </div>
              </div>
              <BulletList bullets={job.bullets} onChange={set([...base, "bullets"])} />
              <RemoveButton onClick={() => removeItem(["content", "experience"], i)} />
            </div>
          );
        })}
        {content.experience.length < 10 && (
          <AddButton onClick={() => addItem(["content", "experience"], blank.job())}>+ Add job</AddButton>
        )}
      </Section>

      <Section title="Projects">
        {content.projects.map((project, i) => {
          const base = ["content", "projects", i];
          return (
            <div key={i} className="space-y-3 rounded border border-slate-200 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Project name" max={150} value={project.name} onChange={set([...base, "name"])} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Start" max={20} placeholder="Aug 2026" value={project.start_date} onChange={set([...base, "start_date"])} />
                  <Field label="End" max={20} placeholder="Sep 2026" value={project.end_date} onChange={set([...base, "end_date"])} />
                </div>
              </div>
              <CsvField
                key={`${version}-tech-${i}`}
                label="Tech stack (comma separated)"
                items={project.tech_stack}
                maxItems={20}
                onChange={set([...base, "tech_stack"])}
              />
              <BulletList bullets={project.bullets} onChange={set([...base, "bullets"])} />
              <RemoveButton onClick={() => removeItem(["content", "projects"], i)} />
            </div>
          );
        })}
        {content.projects.length < 10 && (
          <AddButton onClick={() => addItem(["content", "projects"], blank.project())}>+ Add project</AddButton>
        )}
      </Section>

      <Section title="Education">
        {content.education.map((item, i) => {
          const base = ["content", "education", i];
          return (
            <div key={i} className="space-y-3 rounded border border-slate-200 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Degree" max={150} value={item.degree} onChange={set([...base, "degree"])} />
                <Field label="Institution" max={150} value={item.institution} onChange={set([...base, "institution"])} />
                <Field label="Location" max={100} value={item.location} onChange={set([...base, "location"])} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Start year" max={10} value={item.start_year} onChange={set([...base, "start_year"])} />
                  <Field label="End year" max={10} value={item.end_year} onChange={set([...base, "end_year"])} />
                </div>
              </div>
              <RemoveButton onClick={() => removeItem(["content", "education"], i)} />
            </div>
          );
        })}
        {content.education.length < 5 && (
          <AddButton onClick={() => addItem(["content", "education"], blank.education())}>+ Add education</AddButton>
        )}
      </Section>

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-slate-200 bg-slate-50 py-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded bg-slate-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save resume"}
        </button>
        {status.text && (
          <span className={`text-sm ${status.type === "ok" ? "text-green-700" : "text-red-700"}`}>
            {status.text}
          </span>
        )}
      </div>
    </>
  );
}