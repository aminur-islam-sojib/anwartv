"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  FolderTree,
  X,
  AlertTriangle,
} from "lucide-react";

interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentCategory: { _id: string; name: string; slug: string } | null;
  isActive: boolean;
}

interface CategoryFormState {
  _id?: string;
  name: string;
  slug: string;
  description: string;
  parentCategory: string; // "" means top-level
  isActive: boolean;
}

const emptyForm: CategoryFormState = {
  name: "",
  slug: "",
  description: "",
  parentCategory: "",
  isActive: true,
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState<CategoryFormState>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete/reassign flow state
  const [deleteTarget, setDeleteTarget] = useState<ICategory | null>(null);
  const [deleteMeta, setDeleteMeta] = useState<{
    articleCount: number;
    subCategoryCount: number;
  } | null>(null);
  const [reassignTo, setReassignTo] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/categories?includeInactive=1");
      const result = await res.json();
      if (result.success) {
        setCategories(result.data);
      } else {
        setError(result.message || "ক্যাটাগরি লোড করতে সমস্যা হয়েছে।");
      }
    } catch (err) {
      setError("ক্যাটাগরি লোড করতে ব্যর্থ হয়েছে।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // --- Derived: top-level categories, and children grouped by parent id ---
  const topLevel = categories.filter((c) => !c.parentCategory);
  const childrenOf = (parentId: string) =>
    categories.filter((c) => c.parentCategory?._id === parentId);

  // --- Slug auto-generation from name (Bengali-safe fallback) ---
  const handleNameChange = (value: string) => {
    setFormState((prev) => {
      // Only auto-fill slug if user hasn't manually typed a custom one yet
      const shouldAutoSlug =
        !prev.slug || prev.slug === slugifyPreview(prev.name);
      return {
        ...prev,
        name: value,
        slug: shouldAutoSlug ? slugifyPreview(value) : prev.slug,
      };
    });
  };

  const openCreateForm = () => {
    setFormState(emptyForm);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (cat: ICategory) => {
    setFormState({
      _id: cat._id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      parentCategory: cat.parentCategory?._id || "",
      isActive: cat.isActive,
    });
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormState(emptyForm);
    setFormError("");
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    if (!formState.name || !formState.slug) {
      setFormError("নাম এবং স্ল্যাগ আবশ্যিক।");
      setFormLoading(false);
      return;
    }

    const payload = {
      name: formState.name,
      slug: formState.slug,
      description: formState.description || undefined,
      parentCategory: formState.parentCategory || null,
      isActive: formState.isActive,
    };

    try {
      const isEdit = Boolean(formState._id);
      const url = isEdit
        ? `/api/categories/${formState._id}`
        : "/api/categories";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "সংরক্ষণ করতে ব্যর্থ হয়েছে।");
      }

      closeForm();
      fetchCategories();
    } catch (err: any) {
      setFormError(err.message || "একটি সমস্যা হয়েছে।");
    } finally {
      setFormLoading(false);
    }
  };

  // --- Delete flow ---
  const startDelete = (cat: ICategory) => {
    setDeleteTarget(cat);
    setDeleteMeta(null);
    setReassignTo("");
    setDeleteError("");
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
    setDeleteMeta(null);
    setReassignTo("");
    setDeleteError("");
  };

  const attemptDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError("");

    try {
      const url = reassignTo
        ? `/api/categories/${deleteTarget._id}?reassignTo=${reassignTo}`
        : `/api/categories/${deleteTarget._id}`;

      const res = await fetch(url, { method: "DELETE" });
      const result = await res.json();

      if (res.status === 409) {
        // In use — show reassign picker
        setDeleteMeta(result.meta);
        setDeleteError(result.message);
        setDeleteLoading(false);
        return;
      }

      if (!res.ok || !result.success) {
        throw new Error(result.message || "ডিলিট করতে ব্যর্থ হয়েছে।");
      }

      cancelDelete();
      fetchCategories();
    } catch (err: any) {
      setDeleteError(err.message || "একটি সমস্যা হয়েছে।");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderTree className="h-5 w-5 text-slate-400" />
          <h1 className="text-xl font-bold text-slate-800 dark:text-zinc-100">
            ক্যাটাগরি ম্যানেজমেন্ট
          </h1>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 bg-[#cc0000] hover:bg-[#a30000] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="h-4 w-4" />
          নতুন ক্যাটাগরি
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border border-red-100 dark:border-red-900/50 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
          </div>
        ) : topLevel.length === 0 ? (
          <div className="text-center py-16 text-sm text-slate-400">
            কোনো ক্যাটাগরি নেই। নতুন ক্যাটাগরি যোগ করুন।
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
            {topLevel.map((cat) => (
              <li key={cat._id}>
                <CategoryRow
                  cat={cat}
                  onEdit={openEditForm}
                  onDelete={startDelete}
                />
                {childrenOf(cat._id).length > 0 && (
                  <ul className="bg-slate-50/50 dark:bg-zinc-800/30">
                    {childrenOf(cat._id).map((child) => (
                      <li key={child._id}>
                        <CategoryRow
                          cat={child}
                          indented
                          onEdit={openEditForm}
                          onDelete={startDelete}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* --- Create/Edit Modal --- */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 dark:text-zinc-100">
                {formState._id ? "ক্যাটাগরি সম্পাদনা" : "নতুন ক্যাটাগরি"}
              </h2>
              <button
                onClick={closeForm}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border border-red-100 dark:border-red-900/50 rounded-lg text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                  নাম *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-slate-50/50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cc0000] text-sm text-slate-800 dark:text-zinc-100"
                  value={formState.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                  স্ল্যাগ *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-slate-50/50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cc0000] text-sm text-slate-800 dark:text-zinc-100"
                  value={formState.slug}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                  প্যারেন্ট ক্যাটাগরি
                </label>
                <select
                  className="w-full px-3 py-2 bg-slate-50/50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cc0000] text-sm text-slate-800 dark:text-zinc-100"
                  value={formState.parentCategory}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      parentCategory: e.target.value,
                    }))
                  }
                >
                  <option value="">কোনো প্যারেন্ট নেই (মূল ক্যাটাগরি)</option>
                  {topLevel
                    .filter((c) => c._id !== formState._id) // can't be own parent
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-zinc-400">
                  বিবরণ
                </label>
                <textarea
                  className="w-full px-3 py-2 bg-slate-50/50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cc0000] text-sm text-slate-800 dark:text-zinc-100"
                  rows={2}
                  maxLength={200}
                  value={formState.description}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded text-[#cc0000] focus:ring-[#cc0000] border-slate-300 dark:border-zinc-700"
                  checked={formState.isActive}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                />
                <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                  সক্রিয়
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex items-center gap-2 bg-[#cc0000] hover:bg-[#a30000] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
                >
                  {formLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Delete Confirmation / Reassign Modal --- */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-800 dark:text-zinc-100">
                &ldquo;{deleteTarget.name}&rdquo; ডিলিট করবেন?
              </h2>
            </div>

            {deleteError && (
              <div className="p-3 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 rounded-lg text-xs">
                {deleteError}
              </div>
            )}

            {deleteMeta && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {deleteMeta.articleCount > 0 &&
                    `${deleteMeta.articleCount}টি আর্টিকেল `}
                  {deleteMeta.subCategoryCount > 0 &&
                    `${deleteMeta.subCategoryCount}টি সাব-ক্যাটাগরি `}
                  এই ক্যাটাগরিতে আছে। নিচে থেকে একটি নতুন ক্যাটাগরি নির্বাচন করুন যেখানে এগুলো স্থানান্তর হবে।
                </p>
                <select
                  className="w-full px-3 py-2 bg-slate-50/50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#cc0000] text-sm text-slate-800 dark:text-zinc-100"
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                >
                  <option value="">নির্বাচন করুন...</option>
                  {topLevel
                    .filter((c) => c._id !== deleteTarget._id)
                    .map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {!deleteMeta && !deleteError && (
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                এই কাজটি আর ফিরিয়ে নেওয়া যাবে না।
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={attemptDelete}
                disabled={deleteLoading || (Boolean(deleteMeta) && !reassignTo)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
              >
                {deleteLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                ডিলিট করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Row subcomponent ---
function CategoryRow({
  cat,
  indented = false,
  onEdit,
  onDelete,
}: {
  cat: ICategory;
  indented?: boolean;
  onEdit: (cat: ICategory) => void;
  onDelete: (cat: ICategory) => void;
}) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 ${
        indented ? "pl-10" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        {indented && <span className="text-slate-300 dark:text-zinc-600">└</span>}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
              {cat.name}
            </span>
            {!cat.isActive && (
              <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                নিষ্ক্রিয়
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400">{cat.slug}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(cat)}
          className="p-2 text-slate-400 hover:text-[#cc0000] hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(cat)}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Lightweight client-side slug preview — mirrors slugify's basic behavior
// closely enough for a live preview; the server still generates the source of truth.
function slugifyPreview(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-\u0980-\u09FF]+/g, "")
    .replace(/\-\-+/g, "-");
}