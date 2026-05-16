import { Link } from "wouter";
import { Eye, Heart, MessageSquare, Calendar, Pin, Star } from "lucide-react";
import { formatRelative } from "@/lib/utils";
import { Avatar } from "./Avatar";
import type { Post } from "@workspace/api-client-react";

interface PostCardProps {
  post: Post;
  index?: number;
}

export function PostCard({ post, index = 0 }: PostCardProps) {
  const catColor = post.category?.color ?? "#D4A853";

  return (
    <div
      className="post-card pixel-border-top bg-card rounded-md overflow-hidden"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {post.coverImageUrl && (
        <Link href={`/post/${post.slug}`}>
          <div className="relative h-48 overflow-hidden">
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
            {post.isPinned && (
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-gold/90 text-black text-xs font-heading font-bold px-2 py-1 rounded">
                <Pin size={10} /> FIXADO
              </div>
            )}
            {post.isFeatured && (
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-accent/90 text-white text-xs font-heading font-bold px-2 py-1 rounded">
                <Star size={10} /> DESTAQUE
              </div>
            )}
          </div>
        </Link>
      )}

      <div className="p-4">
        {post.category && (
          <span
            className="cat-badge inline-block mb-2"
            style={{ backgroundColor: catColor + "20", color: catColor, border: `1px solid ${catColor}40` }}
          >
            {post.category.name}
          </span>
        )}

        <Link href={`/post/${post.slug}`}>
          <h2 className="font-heading font-bold text-lg text-foreground hover:text-gold transition-colors line-clamp-2 mb-2 leading-snug">
            {post.title}
          </h2>
        </Link>

        {post.excerpt && (
          <p className="text-muted-foreground text-sm line-clamp-3 mb-3 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.tags.slice(0, 4).map(tag => (
              <Link key={tag} href={`/?tag=${tag}`}>
                <span className="text-xs text-muted-foreground hover:text-gold transition-colors cursor-pointer">
                  #{tag}
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Avatar username={post.author?.username ?? "?"} avatarUrl={post.author?.avatarUrl} size="sm" />
            <span className="text-xs text-muted-foreground font-medium">{post.author?.username}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye size={12} /> {post.viewCount}
            </span>
            <span className="flex items-center gap-1">
              <Heart size={12} /> {post.likeCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare size={12} /> {post.commentCount}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={12} /> {formatRelative(post.createdAt)}
            </span>
          </div>
        </div>

        <Link href={`/post/${post.slug}`}>
          <button className="mt-3 w-full py-2 bg-gold/10 hover:bg-gold/20 border border-gold/30 hover:border-gold/60 text-gold font-heading text-xs font-bold tracking-widest uppercase transition-all duration-200 rounded">
            Ler Mais
          </button>
        </Link>
      </div>
    </div>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="bg-card rounded-md overflow-hidden border-t-2 border-gold/20">
      <div className="skeleton h-48 w-full" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-6 w-full" />
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-4 w-5/6" />
        <div className="flex justify-between mt-4">
          <div className="skeleton h-5 w-24" />
          <div className="skeleton h-5 w-32" />
        </div>
      </div>
    </div>
  );
}
