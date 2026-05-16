import { useGetUsers, useUpdateUserRole, getGetUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { Avatar } from "@/components/Avatar";
import { Shield } from "lucide-react";

const ROLES = ["USER", "ADMIN", "OWNER"] as const;
const roleColors: Record<string, string> = {
  USER: "#6B6880",
  ADMIN: "#7C3AED",
  OWNER: "#D4A853",
};

export function AdminUsers() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useGetUsers();
  const updateRole = useUpdateUserRole();

  const handleRoleChange = (userId: number, role: string) => {
    updateRole.mutate(
      { id: userId, data: { role: role as any } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetUsersQueryKey() }) }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield size={20} className="text-gold" />
        <h1 className="font-heading font-bold text-2xl text-gold">GERENCIAR USUARIOS</h1>
      </div>

      <div className="bg-card border border-border/60 rounded-md overflow-hidden pixel-border-top">
        <div className="px-4 py-3 border-b border-border/60 bg-black/20">
          <h2 className="font-heading text-xs font-bold text-gold uppercase tracking-wider">Usuarios ({users?.length ?? 0})</h2>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 rounded" />)}</div>
        ) : (
          <div className="divide-y divide-border/40">
            {users?.map(u => (
              <div
                key={u.id}
                className="flex items-center gap-4 px-4 py-3"
              >
                <Avatar username={u.username} avatarUrl={u.avatarUrl} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{u.username}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                  <p className="text-xs text-muted-foreground/60">Membro desde {formatDate(u.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {u.id === currentUser?.id ? (
                    <span
                      className="text-xs font-heading font-bold px-3 py-1 rounded"
                      style={{ backgroundColor: roleColors[u.role] + "20", color: roleColors[u.role] }}
                    >
                      {u.role} (voce)
                    </span>
                  ) : (
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      disabled={updateRole.isPending}
                      className="bg-muted border border-border rounded px-2 py-1 text-xs font-heading outline-none transition-colors"
                      style={{ color: roleColors[u.role] }}
                    >
                      {ROLES.map(r => (
                        <option key={r} value={r} style={{ color: roleColors[r] }}>{r}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
