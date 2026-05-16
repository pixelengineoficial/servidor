import { Link } from "wouter";
import { useGetAnalyticsOverview } from "@workspace/api-client-react";
import { Eye, Heart, MessageSquare, Users, FileText, TrendingUp, PlusCircle, Settings, Tag } from "lucide-react";

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: React.ReactNode; color: string }) {
  return (
    <div
      className="bg-card border border-border/60 rounded-md p-4 pixel-border-top relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-16 h-16 opacity-5" style={{ color }}>
        <div className="w-full h-full flex items-end justify-end p-2 text-4xl">
          {icon}
        </div>
      </div>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-heading text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
          <p className="text-3xl font-heading font-bold" style={{ color }}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
        </div>
        <div className="p-2 rounded" style={{ backgroundColor: color + "20" }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const { data: analytics, isLoading } = useGetAnalyticsOverview();

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-gold">PAINEL ADMIN</h1>
          <p className="text-xs text-muted-foreground mt-1">Gerencie seu blog</p>
        </div>
        <Link href="/admin/posts/new">
          <button className="flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold/90 text-black font-heading font-bold text-xs uppercase rounded glow-gold transition-all">
            <PlusCircle size={14} /> Novo Post
          </button>
        </Link>
      </div>

      {/* Stats grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-24 rounded" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Posts" value={analytics?.totalPosts ?? 0} icon={<FileText size={18} />} color="#D4A853" />
          <StatCard label="Usuarios" value={analytics?.totalUsers ?? 0} icon={<Users size={18} />} color="#7C3AED" />
          <StatCard label="Comentarios" value={analytics?.totalComments ?? 0} icon={<MessageSquare size={18} />} color="#3B82F6" />
          <StatCard label="Visualizacoes" value={analytics?.totalViews ?? 0} icon={<Eye size={18} />} color="#22C55E" />
          <StatCard label="Curtidas" value={analytics?.totalLikes ?? 0} icon={<Heart size={18} />} color="#E85C5C" />
          <StatCard label="Posts esta semana" value={analytics?.postsThisWeek ?? 0} icon={<TrendingUp size={18} />} color="#F59E0B" />
          <StatCard label="Coments esta semana" value={analytics?.commentsThisWeek ?? 0} icon={<MessageSquare size={18} />} color="#8B5CF6" />
          <StatCard label="Top posts" value={analytics?.topPosts?.length ?? 0} icon={<TrendingUp size={18} />} color="#EC4899" />
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-card border border-border/60 rounded-md overflow-hidden pixel-border-top">
        <div className="px-4 py-3 border-b border-border/60 bg-black/20">
          <h2 className="font-heading text-xs font-bold text-gold uppercase tracking-wider">Acoes Rapidas</h2>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/admin/posts/new", icon: <PlusCircle size={20} />, label: "Novo Post", color: "#D4A853" },
            { href: "/admin/categories", icon: <Tag size={20} />, label: "Categorias", color: "#7C3AED" },
            { href: "/admin/comments", icon: <MessageSquare size={20} />, label: "Comentarios", color: "#3B82F6" },
            { href: "/admin/users", icon: <Users size={20} />, label: "Usuarios", color: "#22C55E" },
          ].map(action => (
            <Link key={action.href} href={action.href}>
              <div className="flex flex-col items-center gap-2 p-4 bg-muted hover:bg-muted/80 border border-border hover:border-current rounded-md cursor-pointer transition-all group" style={{ '--tw-border-opacity': 0.4 } as any}>
                <span className="transition-colors" style={{ color: action.color }}>{action.icon}</span>
                <span className="text-xs font-heading text-muted-foreground group-hover:text-foreground transition-colors text-center">{action.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Top posts */}
      {analytics?.topPosts && analytics.topPosts.length > 0 && (
        <div className="bg-card border border-border/60 rounded-md overflow-hidden pixel-border-top">
          <div className="px-4 py-3 border-b border-border/60 bg-black/20 flex items-center gap-2">
            <TrendingUp size={14} className="text-gold" />
            <h2 className="font-heading text-xs font-bold text-gold uppercase tracking-wider">Posts Mais Vistos</h2>
          </div>
          <div className="divide-y divide-border/40">
            {analytics.topPosts.map((post, i) => (
              <div key={post.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-heading text-gold w-5 text-center">{i + 1}</span>
                  <Link href={`/post/${post.slug}`}>
                    <span className="text-sm text-foreground hover:text-gold transition-colors line-clamp-1 cursor-pointer">{post.title}</span>
                  </Link>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0 ml-4">
                  <span className="flex items-center gap-1"><Eye size={11} /> {post.viewCount}</span>
                  <Link href={`/admin/posts/${post.id}/edit`}>
                    <span className="text-gold hover:underline cursor-pointer font-heading">EDITAR</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
