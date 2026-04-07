import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, MagnifyingGlass, TrashSimple } from "@phosphor-icons/react";
import type { LessonModule } from "../../types/lesson";
import { deleteLessonModule } from "../../lib/lessons/admin";
import { fetchAdminLessonModules } from "../../lib/lessons/queries";

export default function AdminLessonsPage() {
  const [modules, setModules] = useState<LessonModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "free" | "paid">("all");

  const loadModules = async () => {
    setLoading(true);
    const { data, error: requestError } = await fetchAdminLessonModules();
    if (requestError) {
      setError(requestError.message);
    } else {
      setModules(data ?? []);
      setError(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadModules();
  }, []);

  const filteredModules = useMemo(() => {
    return modules.filter((module) => {
      const matchesQuery =
        module.title.toLowerCase().includes(query.toLowerCase()) ||
        module.slug.toLowerCase().includes(query.toLowerCase());

      if (!matchesQuery) {
        return false;
      }

      if (filter === "published") {
        return module.is_published;
      }

      if (filter === "draft") {
        return !module.is_published;
      }

      if (filter === "free") {
        return module.is_free;
      }

      if (filter === "paid") {
        return !module.is_free;
      }

      return true;
    });
  }, [filter, modules, query]);

  return (
    <div className="min-h-screen bg-neutral-950 pt-24 pb-24">
      <div className="mx-auto max-w-screen-xl px-6 md:px-10">
        <div className="flex flex-wrap items-start justify-between gap-4 py-10">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-amber-300">Admin Panel</p>
            <h1 className="mt-3 font-serif text-4xl text-white">Lessons Manager</h1>
            <p className="mt-3 max-w-2xl text-sm text-neutral-400">
              Keep lesson modules tidy, ordered, and easy to update without leaving the existing
              studio flow.
            </p>
          </div>
          <Link
            to="/admin/lessons/new"
            className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-5 py-2.5 font-sans text-xs uppercase tracking-widest text-white transition-colors duration-300 hover:bg-amber-500"
          >
            <Plus size={16} weight="bold" />
            New Lesson Module
          </Link>
        </div>

        <div className="grid gap-4 rounded-2xl border border-border bg-secondary p-5 md:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative block">
            <MagnifyingGlass size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by lesson title or slug..."
              className="w-full rounded-md border border-border bg-neutral-900 py-3 pl-11 pr-4 text-white focus:border-tertiary focus:outline-none"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {(["all", "published", "draft", "free", "paid"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={`rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.3em] ${
                  filter === option
                    ? "border-tertiary bg-tertiary text-background"
                    : "border-border text-neutral-300"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="py-20 text-center text-neutral-400">Loading lessons...</p>}
        {error && <p className="py-20 text-center text-red-300">{error}</p>}

        {!loading && !error && (
          <div className="mt-6 space-y-3">
            {filteredModules.map((module) => (
              <div
                key={module.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-secondary px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-serif text-h4 text-foreground">{module.title}</h2>
                    <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400">
                      {module.is_published ? "Published" : "Draft"}
                    </span>
                    <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400">
                      {module.is_free ? "Free" : "Paid"}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                    /learn/module/{module.slug}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/admin/lessons/${module.id}/edit`}
                    className="rounded border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-200 transition-colors duration-300 hover:border-tertiary hover:text-tertiary"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm(`Delete "${module.title}"?`)) {
                        return;
                      }

                      const { error: deleteError } = await deleteLessonModule(module.id);
                      if (deleteError) {
                        setError(deleteError.message);
                        return;
                      }

                      await loadModules();
                    }}
                    className="rounded border border-red-500/30 px-4 py-2 text-red-300"
                    title="Delete lesson"
                  >
                    <TrashSimple size={14} />
                  </button>
                </div>
              </div>
            ))}
            {filteredModules.length === 0 && (
              <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center text-neutral-500">
                No lessons match the current search.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
