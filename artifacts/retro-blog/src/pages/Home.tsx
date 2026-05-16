import { useState, useEffect } from "react";
import { useGetPosts, useGetFeaturedPosts, useGetPinnedPosts, getGetPostsQueryKey } from "@workspace/api-client-react";
import { PostCard, PostCardSkeleton } from "@/components/PostCard";
import { ChevronLeft, ChevronRight, Pin, Zap } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import socket from "@/lib/socket";

export function Home() {
  const [page, setPage] = useState(1);
  const limit = 9;
  const queryClient = useQueryClient();

  const { data: postsPage, isLoading } = useGetPosts({ page, limit });
  const { data: featured } = useGetFeaturedPosts();
  const { data: pinned } = useGetPinnedPosts();
  const [featuredIdx, setFeaturedIdx] = useState(0);

  const posts = postsPage?.posts ?? [];
  const total = postsPage?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const featuredPosts = featured ?? [];

  // Rotate featured
  useEffect(() => {
    if (featuredPosts.length <= 1) return;
    const t = setInterval(() => setFeaturedIdx(i => (i + 1) % featuredPosts.length), 5000);
    return () => clearInterval(t);
  }, [featuredPosts.length]);

  return (
    <div className="space-y-8">
      {/* Featured carousel */}
      {featuredPosts.length > 0 && (
        <div
          className="relative rounded-md overflow-hidden pixel-border-top bg-card"
        >
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gold/20 bg-black/20">
            <Zap size={14} className="text-gold" />
            <span className="font-heading text-xs text-gold font-bold tracking-widest uppercase">Destaques</span>
          </div>

          {(() => {
            const fp = featuredPosts[featuredIdx];
            if (!fp) return null;
            return (
              <div className="relative h-64 sm:h-80 overflow-hidden">
                {fp.coverImageUrl ? (
                  <img src={fp.coverImageUrl} alt={fp.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-card to-muted" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  {fp.category && (
                    <span
                      className="cat-badge inline-block mb-2"
                      style={{ backgroundColor: (fp.category.color ?? "#D4A853") + "30", color: fp.category.color ?? "#D4A853", border: `1px solid ${fp.category.color ?? "#D4A853"}50` }}
                    >
                      {fp.category.name}
                    </span>
                  )}
                  <Link href={`/post/${fp.slug}`}>
                    <h2 className="font-heading font-bold text-xl sm:text-2xl text-white hover:text-gold transition-colors cursor-pointer leading-snug mb-2">
                      {fp.title}
                    </h2>
                  </Link>
                  {fp.excerpt && <p className="text-sm text-white/70 line-clamp-2">{fp.excerpt}</p>}
                </div>
                {/* Carousel nav */}
                {featuredPosts.length > 1 && (
                  <>
                    <button
                      onClick={() => setFeaturedIdx(i => (i - 1 + featuredPosts.length) % featuredPosts.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-gold/30 rounded border border-gold/30 flex items-center justify-center text-white transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setFeaturedIdx(i => (i + 1) % featuredPosts.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-gold/30 rounded border border-gold/30 flex items-center justify-center text-white transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <div className="absolute bottom-3 right-4 flex gap-1.5">
                      {featuredPosts.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setFeaturedIdx(i)}
                          className={`w-2 h-2 rounded-full transition-all ${i === featuredIdx ? "bg-gold w-4" : "bg-white/40"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Pinned posts */}
      {pinned && pinned.length > 0 && (
        <div
          className="bg-card/50 border border-gold/20 rounded-md overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-gold/5 border-b border-gold/20">
            <Pin size={13} className="text-gold" />
            <span className="font-heading text-xs text-gold font-bold tracking-widest uppercase">Posts Fixados</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border">
            {pinned.map(p => (
              <Link key={p.id} href={`/post/${p.slug}`}>
                <div className="bg-card px-4 py-3 hover:bg-muted transition-colors cursor-pointer">
                  <p className="text-sm font-medium text-foreground hover:text-gold transition-colors line-clamp-1 mb-1">{p.title}</p>
                  {p.excerpt && <p className="text-xs text-muted-foreground line-clamp-1">{p.excerpt}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Posts feed */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-gold/20" />
          <h2 className="font-heading text-sm font-bold text-gold uppercase tracking-widest">Ultimas Postagens</h2>
          <div className="h-px flex-1 bg-gold/20" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-title text-gold text-xs mb-4">[ VAZIO ]</p>
            <p className="text-muted-foreground font-heading text-sm">Nenhuma postagem encontrada</p>
            <p className="text-xs text-muted-foreground/60 mt-2">Aguarde novos conteudos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post, i) => <PostCard key={post.id} post={post} index={i} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-2 bg-card border border-border text-muted-foreground hover:text-gold hover:border-gold/40 disabled:opacity-40 disabled:cursor-not-allowed rounded text-xs font-heading transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .map((p, idx, arr) => (
                <span key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-muted-foreground text-xs px-1">...</span>}
                  <button
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded text-xs font-heading transition-colors ${
                      p === page
                        ? "bg-gold text-black font-bold"
                        : "bg-card border border-border text-muted-foreground hover:text-gold hover:border-gold/40"
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 bg-card border border-border text-muted-foreground hover:text-gold hover:border-gold/40 disabled:opacity-40 disabled:cursor-not-allowed rounded text-xs font-heading transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
