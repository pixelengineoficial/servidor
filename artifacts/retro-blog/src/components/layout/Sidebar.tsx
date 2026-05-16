import { Link } from "wouter";
import { Tag, Folder, Clock, Users, Archive, TrendingUp } from "lucide-react";
import { useGetCategories, useGetRecentPosts, useGetTags, useGetOnlineCount } from "@workspace/api-client-react";
import { formatRelative } from "@/lib/utils";
import { useEffect, useState } from "react";
import socket from "@/lib/socket";

function SidebarSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border/60 rounded-md overflow-hidden pixel-border-top">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-black/30 border-b border-border/60">
        <span className="text-gold">{icon}</span>
        <h3 className="font-heading text-xs font-bold text-gold tracking-wider uppercase">{title}</h3>
      </div>
      <div className="p-3">
        {children}
      </div>
    </div>
  );
}

export function Sidebar() {
  const { data: categories, isLoading: catsLoading } = useGetCategories();
  const { data: recentPosts, isLoading: recentLoading } = useGetRecentPosts();
  const { data: tags } = useGetTags();
  const { data: onlineData } = useGetOnlineCount();
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    if (onlineData?.count !== undefined) setOnlineCount(onlineData.count);
  }, [onlineData]);

  useEffect(() => {
    socket.on("online_count", (data: { count: number }) => setOnlineCount(data.count));
    return () => { socket.off("online_count"); };
  }, []);

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  });

  return (
    <aside className="space-y-4">
      {/* Online count */}
      <div className="bg-card border border-green-500/30 rounded-md p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className="font-heading text-xs text-green-400 font-bold">VISITANTES ONLINE</span>
        </div>
        <span className="font-title text-green-400 text-sm">{onlineCount}</span>
      </div>

      {/* Categories */}
      <SidebarSection title="Categorias" icon={<Folder size={14} />}>
        {catsLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-7 rounded" />)}
          </div>
        ) : (
          <ul className="space-y-1">
            {categories?.map(cat => (
              <li key={cat.id}>
                <Link href={`/category/${cat.slug}`}>
                  <div className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted transition-colors group cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color ?? "#D4A853" }}
                      />
                      <span className="text-sm text-foreground group-hover:text-gold transition-colors">{cat.name}</span>
                    </div>
                    <span className="text-xs font-heading text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {cat.postCount ?? 0}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SidebarSection>

      {/* Recent posts */}
      <SidebarSection title="Posts Recentes" icon={<Clock size={14} />}>
        {recentLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10 rounded" />)}
          </div>
        ) : (
          <ul className="space-y-3">
            {recentPosts?.map(post => (
              <li key={post.id}>
                <Link href={`/post/${post.slug}`}>
                  <div className="group cursor-pointer">
                    <p className="text-sm text-foreground group-hover:text-gold transition-colors line-clamp-2 leading-snug mb-0.5">
                      {post.title}
                    </p>
                    <span className="text-xs text-muted-foreground">{formatRelative(post.createdAt)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SidebarSection>

      {/* Tags cloud */}
      {tags && tags.length > 0 && (
        <SidebarSection title="Tags" icon={<Tag size={14} />}>
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 20).map(tag => (
              <Link key={tag.name} href={`/?tag=${tag.name}`}>
                <span className="text-xs text-muted-foreground hover:text-gold border border-border hover:border-gold/40 px-2 py-0.5 rounded cursor-pointer transition-colors">
                  #{tag.name}
                  <span className="ml-1 text-muted-foreground/60">{tag.postCount}</span>
                </span>
              </Link>
            ))}
          </div>
        </SidebarSection>
      )}

      {/* Archives */}
      <SidebarSection title="Arquivo" icon={<Archive size={14} />}>
        <ul className="space-y-1">
          {months.map(m => (
            <li key={m}>
              <span className="text-sm text-muted-foreground hover:text-gold transition-colors cursor-pointer capitalize block py-1 border-b border-border/30 last:border-0">
                {m}
              </span>
            </li>
          ))}
        </ul>
      </SidebarSection>

      {/* Stats */}
      <SidebarSection title="Trending" icon={<TrendingUp size={14} />}>
        <p className="text-xs text-muted-foreground text-center py-2">Em breve...</p>
      </SidebarSection>
    </aside>
  );
}
