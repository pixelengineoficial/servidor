import { useState } from "react";
import { useRoute } from "wouter";
import { useGetPosts, useGetCategories } from "@workspace/api-client-react";
import { PostCard, PostCardSkeleton } from "@/components/PostCard";
import { ChevronLeft, ChevronRight, Folder } from "lucide-react";

export function CategoryPage() {
  const [, params] = useRoute("/category/:slug");
  const slug = params?.slug ?? "";
  const [page, setPage] = useState(1);
  const limit = 9;

  const { data: categories } = useGetCategories();
  const cat = categories?.find(c => c.slug === slug);

  const { data: postsPage, isLoading } = useGetPosts({ page, limit, categoryId: cat?.id });

  const posts = postsPage?.posts ?? [];
  const total = postsPage?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="bg-card border border-border/60 rounded-md px-6 py-4 flex items-center gap-3 pixel-border-top"
      >
        <div className="w-10 h-10 rounded flex items-center justify-center" style={{ backgroundColor: (cat?.color ?? "#D4A853") + "20", border: `1px solid ${cat?.color ?? "#D4A853"}40` }}>
          <Folder size={18} style={{ color: cat?.color ?? "#D4A853" }} />
        </div>
        <div>
          <h1 className="font-heading font-bold text-xl text-foreground">{cat?.name ?? slug}</h1>
          {cat?.description && <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>}
          <p className="text-xs text-muted-foreground">{total} post{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Posts grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <PostCardSkeleton key={i} />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-title text-gold text-xs mb-4">[ VAZIO ]</p>
          <p className="text-muted-foreground">Nenhum post nesta categoria ainda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post, i) => <PostCard key={post.id} post={post} index={i} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 bg-card border border-border text-muted-foreground hover:text-gold hover:border-gold/40 disabled:opacity-40 rounded text-xs font-heading transition-colors">
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded text-xs font-heading transition-colors ${p === page ? "bg-gold text-black font-bold" : "bg-card border border-border text-muted-foreground hover:text-gold"}`}>
              {p}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 bg-card border border-border text-muted-foreground hover:text-gold hover:border-gold/40 disabled:opacity-40 rounded text-xs font-heading transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
