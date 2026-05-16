import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { useGetPosts } from "@workspace/api-client-react";
import { PostCard, PostCardSkeleton } from "@/components/PostCard";
import { Search } from "lucide-react";

export function SearchPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const query = params.get("q") ?? "";
  const [inputVal, setInputVal] = useState(query);

  const { data: postsPage, isLoading } = useGetPosts({ search: query || undefined, limit: 12 });

  const posts = postsPage?.posts ?? [];

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border/60 rounded-md p-6 pixel-border-top">
        <h1 className="font-heading font-bold text-xl text-gold mb-4 flex items-center gap-2">
          <Search size={18} /> PESQUISAR
        </h1>
        <form onSubmit={(e) => { e.preventDefault(); window.location.href = `/search?q=${encodeURIComponent(inputVal)}`; }}>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="Pesquisar posts..."
              className="flex-1 bg-muted border border-border focus:border-gold/60 rounded px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors"
            />
            <button type="submit" className="px-6 py-2.5 bg-gold/10 hover:bg-gold/20 border border-gold/30 hover:border-gold/60 text-gold font-heading text-xs font-bold rounded transition-all">
              BUSCAR
            </button>
          </div>
        </form>
      </div>

      {query && (
        <div>
          <p className="text-sm text-muted-foreground mb-4 font-heading">
            {isLoading ? "Buscando..." : `${posts.length} resultado(s) para "${query}"`}
          </p>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <PostCardSkeleton key={i} />)}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-title text-gold text-xs mb-4">[ 0 RESULTADOS ]</p>
              <p className="text-muted-foreground">Nenhum post encontrado para "{query}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post, i) => <PostCard key={post.id} post={post} index={i} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
