import { useGetPosts, useGetPostComments, useDeleteComment, getGetPostCommentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { formatRelative } from "@/lib/utils";
import { Avatar } from "@/components/Avatar";

export function AdminComments() {
  const { data: postsPage } = useGetPosts({ limit: 100 });
  const [selectedPostId, setSelectedPostId] = useState<number | undefined>();
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useGetPostComments(selectedPostId ?? 0);
  const deleteComment = useDeleteComment();

  const handleDelete = (id: number) => {
    if (!confirm("Excluir comentario?")) return;
    deleteComment.mutate({ id } as any, {
      onSuccess: () => {
        if (selectedPostId) queryClient.invalidateQueries({ queryKey: getGetPostCommentsQueryKey(selectedPostId) });
      },
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading font-bold text-2xl text-gold">COMENTARIOS</h1>

      {/* Post selector */}
      <div className="bg-card border border-border/60 rounded-md p-4">
        <label className="block text-xs font-heading text-gold mb-2 uppercase tracking-wider">Selecionar Post</label>
        <select
          value={selectedPostId ?? ""}
          onChange={e => setSelectedPostId(e.target.value ? parseInt(e.target.value) : undefined)}
          className="w-full bg-muted border border-border focus:border-gold/60 rounded px-3 py-2 text-sm text-foreground outline-none transition-colors"
        >
          <option value="">Escolha um post...</option>
          {postsPage?.posts.map(p => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      </div>

      {/* Comments */}
      {selectedPostId && (
        <div className="bg-card border border-border/60 rounded-md overflow-hidden pixel-border-top">
          <div className="px-4 py-3 border-b border-border/60 bg-black/20 flex items-center gap-2">
            <MessageSquare size={14} className="text-gold" />
            <h2 className="font-heading text-xs font-bold text-gold uppercase tracking-wider">Comentarios</h2>
          </div>
          {isLoading ? (
            <div className="p-4 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-14 rounded" />)}</div>
          ) : !comments?.length ? (
            <p className="text-center text-sm text-muted-foreground py-8">Nenhum comentario neste post</p>
          ) : (
            <div className="divide-y divide-border/40">
              {comments.map(c => (
                <div key={c.id} className="flex items-start gap-3 px-4 py-3">
                  <Avatar username={c.author?.username ?? "?"} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-heading text-gold">{c.author?.username}</span>
                      <span className="text-xs text-muted-foreground">{formatRelative(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-foreground/90">{c.content}</p>
                  </div>
                  <button onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 mt-0.5">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
