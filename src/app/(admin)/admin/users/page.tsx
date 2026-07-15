"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Loader2,
  MoreVertical,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UserRole = "admin" | "editor" | "writer" | "reader";
type AccountStatus = "active" | "inactive" | "suspended";
type RoleFilter = "all" | UserRole;
type StatusFilter = "all" | AccountStatus;

interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  isVerified: boolean;
  avatar: string;
  articlesCount: number;
  createdAt: string;
  updatedAt: string;
}

interface IUserMetrics {
  totalStaff: number;
  activeWriters: number;
  pendingApprovals: number;
  suspendedAccounts: number;
}

interface UsersApiResponse {
  success: boolean;
  message?: string;
  data: IUser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  metrics: IUserMetrics;
}

const roleOptions: UserRole[] = ["admin", "editor", "writer", "reader"];
const statusOptions: AccountStatus[] = ["active", "inactive", "suspended"];

const roleStyles: Record<UserRole, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  editor: "bg-purple-50 text-purple-700 border-purple-200",
  writer: "bg-blue-50 text-blue-700 border-blue-200",
  reader: "bg-muted text-muted-foreground border-border",
};

const statusStyles: Record<AccountStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-amber-50 text-amber-700 border-amber-200",
  suspended: "bg-destructive/10 text-destructive border-destructive/20",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function toTitle(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {value.toLocaleString()}
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

export default function UserManagementPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<IUser[]>([]);
  const [metrics, setMetrics] = useState<IUserMetrics>({
    totalStaff: 0,
    activeWriters: 0,
    pendingApprovals: 0,
    suspendedAccounts: 0,
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [limit, setLimit] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [actionMenuUserId, setActionMenuUserId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("writer");
  const [loading, setLoading] = useState(true);
  const [mutatingUserId, setMutatingUserId] = useState<string | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [error, setError] = useState("");

  const currentUserId = session?.user?.id;
  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadUsers = useCallback(
    async (signal?: AbortSignal) => {
      if (status !== "authenticated" || !isAdmin) return;

      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: debouncedSearch,
        role: roleFilter,
        status: statusFilter,
      });

      try {
        const res = await fetch(`/api/admin/users?${params.toString()}`, {
          signal,
        });
        const result = (await res.json()) as UsersApiResponse;

        if (!res.ok || !result.success) {
          throw new Error(result.message || "Failed to load users.");
        }

        setUsers(result.data);
        setMetrics(result.metrics);
        setTotalUsers(result.meta.total);
        setTotalPages(result.meta.totalPages);
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load users.",
        );
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, isAdmin, limit, page, roleFilter, status, statusFilter],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      loadUsers(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadUsers]);

  const isCurrentUser = (user: IUser) => user.id === currentUserId;

  const updateUser = async (
    user: IUser,
    payload: Partial<Pick<IUser, "role" | "status">>,
  ) => {
    if (isCurrentUser(user)) return;

    const previousUsers = users;
    setMutatingUserId(user.id);
    setActionMenuUserId(null);
    setUsers((currentUsers) =>
      currentUsers.map((currentUser) =>
        currentUser.id === user.id
          ? { ...currentUser, ...payload }
          : currentUser,
      ),
    );

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await res.json()) as {
        success: boolean;
        message?: string;
        data?: Partial<IUser>;
      };

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to update user.");
      }

      await loadUsers();
    } catch (requestError) {
      setUsers(previousUsers);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to update user.",
      );
    } finally {
      setMutatingUserId(null);
    }
  };

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreatingUser(true);
    setError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          role: newRole,
        }),
      });
      const result = (await res.json()) as {
        success: boolean;
        message?: string;
      };

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to create user.");
      }

      setNewName("");
      setNewEmail("");
      setNewRole("writer");
      setInviteOpen(false);
      setPage(1);
      await loadUsers();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to create user.",
      );
    } finally {
      setCreatingUser(false);
    }
  };

  const rangeLabel = useMemo(() => {
    if (!totalUsers) return "0 users";
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, totalUsers);
    return `${start.toLocaleString()}-${end.toLocaleString()} of ${totalUsers.toLocaleString()} users`;
  }, [limit, page, totalUsers]);

  if (status === "loading") {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-sm font-medium text-muted-foreground">
        Loading user controls...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded-lg border border-border bg-card p-8">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-destructive" />
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Admin access required
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              User management is restricted to newsroom administrators.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Newsroom HR & Security
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            User Management
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage newsroom staff, reader accounts, access levels, and account
            security states with server-side pagination for large audiences.
          </p>
        </div>
        <Button
          type="button"
          size="lg"
          onClick={() => setInviteOpen(true)}
          className="h-10 px-4"
        >
          <UserPlus className="h-4 w-4" />
          Add New Team Member
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Staff"
          value={metrics.totalStaff}
          icon={Users}
        />
        <MetricCard
          label="Active Writers"
          value={metrics.activeWriters}
          icon={User}
        />
        <MetricCard
          label="Pending Approvals"
          value={metrics.pendingApprovals}
          icon={Clock3}
        />
        <MetricCard
          label="Suspended Accounts"
          value={metrics.suspendedAccounts}
          icon={Ban}
        />
      </div>

      <section className="rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name or email"
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="font-semibold">Filters</span>
            </div>
            <label className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={roleFilter}
                onChange={(event) => {
                  setRoleFilter(event.target.value as RoleFilter);
                  setPage(1);
                }}
                className="h-10 min-w-40 appearance-none rounded-lg border border-input bg-background pl-9 pr-9 text-sm font-semibold text-foreground outline-none focus:border-primary"
              >
                <option value="all">All roles</option>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {toTitle(role)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </label>
            <label className="relative">
              <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as StatusFilter);
                  setPage(1);
                }}
                className="h-10 min-w-44 appearance-none rounded-lg border border-input bg-background pl-9 pr-9 text-sm font-semibold text-foreground outline-none focus:border-primary"
              >
                <option value="all">All statuses</option>
                {statusOptions.map((accountStatus) => (
                  <option key={accountStatus} value={accountStatus}>
                    {toTitle(accountStatus)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </label>
          </div>
        </div>

        {error && (
          <div className="border-b border-border bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-260 border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3.5">User</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Articles Count</th>
                <th className="px-4 py-3.5">Joined</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm font-medium text-muted-foreground"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading users...
                    </span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm font-medium text-muted-foreground"
                  >
                    No users match the current filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const locked = isCurrentUser(user);
                  const menuOpen = actionMenuUserId === user.id;
                  const isMutating = mutatingUserId === user.id;

                  return (
                    <tr
                      key={user.id}
                      className="bg-card transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                            {user.avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={user.avatar}
                                alt=""
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              getInitials(user.name)
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-bold text-foreground">
                                {user.name}
                              </p>
                              {locked && (
                                <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="truncate text-xs font-medium text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <label className="relative inline-flex">
                          <select
                            value={user.role}
                            disabled={locked || isMutating}
                            onChange={(event) =>
                              updateUser(user, {
                                role: event.target.value as UserRole,
                              })
                            }
                            className={cn(
                              "h-9 min-w-32 appearance-none rounded-lg border px-3 pr-8 text-xs font-bold outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                              roleStyles[user.role],
                            )}
                          >
                            {roleOptions.map((role) => (
                              <option key={role} value={role}>
                                {toTitle(role)}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
                        </label>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-1 text-xs font-bold",
                            statusStyles[user.status],
                          )}
                        >
                          {toTitle(user.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-foreground">
                        {user.articlesCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium text-muted-foreground">
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }).format(new Date(user.createdAt))}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="relative inline-flex">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              setActionMenuUserId(menuOpen ? null : user.id)
                            }
                            aria-label={`Open actions for ${user.name}`}
                          >
                            {isMutating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </Button>

                          {menuOpen && (
                            <div className="absolute right-0 top-10 z-20 w-56 rounded-lg border border-border bg-card p-1.5 shadow-sm">
                              <button
                                type="button"
                                disabled={locked || user.status === "active"}
                                onClick={() =>
                                  updateUser(user, { status: "active" })
                                }
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                Reactivate account
                              </button>
                              <button
                                type="button"
                                disabled={locked || user.status === "suspended"}
                                onClick={() =>
                                  updateUser(user, { status: "suspended" })
                                }
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Ban className="h-4 w-4" />
                                Suspend account
                              </button>
                              <button
                                type="button"
                                disabled={locked || user.status === "inactive"}
                                onClick={() =>
                                  updateUser(user, { status: "inactive" })
                                }
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <ShieldAlert className="h-4 w-4" />
                                Mark inactive
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span>{rangeLabel}</span>
            <label className="relative ml-2">
              <select
                value={limit}
                onChange={(event) => {
                  setLimit(Number(event.target.value));
                  setPage(1);
                }}
                className="h-8 appearance-none rounded-lg border border-input bg-background px-3 pr-8 text-sm font-semibold text-foreground outline-none"
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}/page
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() =>
                setPage((currentPage) => Math.max(1, currentPage - 1))
              }
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm font-semibold text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() =>
                setPage((currentPage) => Math.min(totalPages, currentPage + 1))
              }
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg border border-border bg-card">
            <div className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Add New Team Member
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create an account and assign newsroom access immediately.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setInviteOpen(false)}
                aria-label="Close user creation modal"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 p-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Full name
                </label>
                <input
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  required
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground outline-none focus:border-primary"
                  placeholder="Reporter name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Email address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  required
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground outline-none focus:border-primary"
                  placeholder="name@newsroom.com"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Assigned role
                </label>
                <select
                  value={newRole}
                  onChange={(event) =>
                    setNewRole(event.target.value as UserRole)
                  }
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {toTitle(role)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setInviteOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="lg" disabled={creatingUser}>
                  {creatingUser ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Create user
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
