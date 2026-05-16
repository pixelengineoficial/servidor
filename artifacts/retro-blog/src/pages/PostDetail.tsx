import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import {
  useGetPost, useGetPostComments, useCreateComment, useDeleteComment,
  useLikePost, useViewPost,
  getGetPostCommentsQueryKey, getGetPostQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import { formatDate, formatRelative } from "@/lib/utils";
import { Heart, Eye, MessageSquare, Tag, Calendar, User, Trash2, ChevronLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import socket from "@/lib/socket";
import type { Comment } from "@workspace/api-client-react";

export function PostDetail() {
  const [, params] = useRoute("/post/:slug");
  const slug = params?.slug ?? "";
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Try to get post by id (number) or slug (string)
  const postId = isNaN(Number(slug)) ? (slug as unknown as number) : Number(slug);

  const { data: post, isLoading } = useGetPost(postId);

  const { data: comments, isLoading: commentsLoading } = useGetPostComments(post?.id ?? 0);

  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const likePost = useLikePost();
  const viewPost = useViewPost();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (post) {
      setLiked(post.likedByMe ?? false);
      setLikeCount(post.likeCount);
      // Track view
      viewPost.mutate({ id: post.id } as any);
    }
  }, [post?.id]);

  // Real-time comments
  useEffect(() => {
    if (!post?.id) return;
    socket.on("new_comment", (data: { postId: number; comment: Comment }) => {
      if (data.postId === post.id) {
        queryClient.invalidateQueries({ queryKey: getGetPostCommentsQueryKey(post.id) });
      }
    });
    return () => { socket.off("new_comment"); };
  }, [post?.id, queryClient]);

  const handleLike = () => {
    if (!user) return;
    if (!post) return;
    likePost.mutate({ id: post.id } as any, {
      onSuccess: (data) => {
        setLiked(data.liked);
        setLikeCount(data.likeCount);
      },
    });
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !post) return;
    setSubmitting(true);
    createComment.mutate(
      { id: post.id, data: { content: commentText.trim() } } as any,
      {
        onSuccess: () => {
          setCommentText("");
          queryClient.invalidateQueries({ queryKey: getGetPostCommentsQueryKey(post.id) });
        },
        onSettled: () => setSubmitting(false),
      }
    );
  };

  const handleDeleteComment = (commentId: number) => {
    if (!post) return;
    deleteComment.mutate({ id: commentId } as any, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetPostCommentsQueryKey(post.id) }),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-3/4" />
        <div className="skeleton h-64 w-full" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-5/6" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20">
        <p className="font-title text-gold text-xs mb-4">[ 404 ]</p>
        <p className="font-heading text-muted-foreground">Post nao encontrado</p>
        <Link href="/"><button className="mt-4 px-4 py-2 bg-gold/10 border border-gold/30 text-gold rounded font-heading text-xs">Voltar ao inicio</button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back */}
      <Link href="/">
        <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-gold transition-colors font-heading">
          <ChevronLeft size={14} /> Voltar
        </button>
      </Link>

      {/* Article */}
      <article className="bg-card border border-border/60 rounded-md overflow-hidden pixel-border-top">
        {/* Cover */}
        {post.coverImageUrl && (
          <div className="relative h-64 sm:h-96 overflow-hidden">
            <img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
          </div>
        )}

        <div className="p-6 lg:p-8">
          {/* Category + tags */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {post.category && (
              <Link href={`/category/${post.category.slug}`}>
                <span
                  className="cat-badge cursor-pointer"
                  style={{ backgroundColor: (post.category.color ?? "#D4A853") + "20", color: post.category.color ?? "#D4A853", border: `1px solid ${post.category.color ?? "#D4A853"}40` }}
                >
                  {post.category.name}
                </span>
              </Link>
            )}
            {post.tags?.map(tag => (
              <Link key={tag} href={`/?tag=${tag}`}>
                <span className="text-xs text-muted-foreground hover:text-gold cursor-pointer border border-border px-2 py-0.5 rounded transition-colors flex items-center gap-1">
                  <Tag size={10} /> {tag}
                </span>
              </Link>
            ))}
          </div>

          {/* Title */}
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-foreground mb-4 leading-tight">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-6 pb-6 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Avatar username={post.author?.username ?? "?"} avatarUrl={post.author?.avatarUrl} size="sm" />
              <span className="flex items-center gap-1"><User size={11} /> {post.author?.username}</span>
            </div>
            <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(post.createdAt)}</span>
            <span className="flex items-center gap-1"><Eye size={11} /> {post.viewCount} visualizacoes</span>
            <span className="flex items-center gap-1"><MessageSquare size={11} /> {post.commentCount} comentarios</span>
          </div>

          {/* Content */}
          <div className="prose-retro">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Like button */}
          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-border/60">
            <button
              onClick={handleLike}
              disabled={!user}
              className={`flex items-center gap-2 px-4 py-2 rounded border transition-all duration-200 font-heading text-xs font-bold ${
                liked
                  ? "bg-destructive/20 border-destructive text-destructive"
                  : "bg-card border-border text-muted-foreground hover:text-gold hover:border-gold/40"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Heart size={14} className={liked ? "fill-current" : ""} />
              {likeCount} CURTIDAS
            </button>
            {!user && <p className="text-xs text-muted-foreground"><Link href="/login" className="text-gold underline">Faca login</Link> para curtir</p>}
            {isAdmin() && (
              <div className="flex gap-2 ml-auto">
                <Link href={`/admin/posts/${post.id}/edit`}>
                  <button className="px-3 py-1.5 text-xs font-heading border border-border hover:border-gold/40 hover:text-gold text-muted-foreground rounded transition-colors">EDITAR</button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Comments */}
      <div className="bg-card border border-border/60 rounded-md overflow-hidden pixel-border-top">
        <div className="px-6 py-3 border-b border-border/60 bg-black/20 flex items-center gap-2">
          <MessageSquare size={14} className="text-gold" />
          <h3 className="font-heading text-xs font-bold text-gold uppercase tracking-wider">
            Comentarios ({post.commentCount})
          </h3>
        </div>

        <div className="p-6 space-y-6">
          {/* Comment form */}
          {user ? (
            <form onSubmit={handleComment} className="space-y-3">
              <div className="flex items-start gap-3">
                <Avatar username={user.username} avatarUrl={user.avatarUrl} size="md" />
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Deixe seu comentario..."
                    rows={3}
                    maxLength={1000}
                    className="w-full bg-muted border border-border focus:border-gold/50 rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none transition-colors"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{commentText.length}/1000</span>
                    <button
                      type="submit"
                      disabled={!commentText.trim() || submitting}
                      className="px-4 py-1.5 bg-gold/10 hover:bg-gold/20 border border-gold/30 hover:border-gold/60 text-gold font-heading text-xs font-bold rounded disabled:opacity-50 transition-all"
                    >
                      {submitting ? "ENVIANDO..." : "COMENTAR"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              <Link href="/login" className="text-gold underline">Faca login</Link> para comentar
            </p>
          )}

          {/* Comments list */}
          {commentsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded" />)}
            </div>
          ) : comments?.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">Nenhum comentario ainda. Seja o primeiro!</p>
          ) : (
            <div className="space-y-4">
              {comments?.map(comment => (
                <div
                  key={comment.id}
                  className="flex gap-3 pb-4 border-b border-border/40 last:border-0"
                >
                  <Avatar username={comment.author?.username ?? "?"} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-heading font-bold text-gold">{comment.author?.username}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{formatRelative(comment.createdAt)}</span>
                        {(isAdmin() || user?.id === comment.authorId) && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
