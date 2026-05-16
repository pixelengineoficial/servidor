import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import {
  useGetPost, useCreatePost, useUpdatePost, useGetCategories,
  getGetPostsQueryKey, getGetPostQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, Save, ArrowLeft, Pin, Star, Image } from "lucide-react";
import { Link } from "wouter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PostEditorProps {
  mode: "create" | "edit";
}

export function PostEditor({ mode }: PostEditorProps) {
  const [, params] = useRoute("/admin/posts/:id/edit");
  const postId = params?.id ? parseInt(params.id) : undefined;
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const { data: existingPost } = useGetPost(mode === "edit" && postId ? postId : (0 as any));
  const { data: categories } = useGetCategories();
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [tags, setTags] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (existingPost && mode === "edit") {
      setTitle(existingPost.title ?? "");
      setContent(existingPost.content ?? "");
      setExcerpt(existingPost.excerpt ?? "");
      setCoverImageUrl(existingPost.coverImageUrl ?? "");
      setCategoryId(existingPost.categoryId ?? undefined);
      setTags((existingPost.tags ?? []).join(", "));
      setIsPinned(existingPost.isPinned);
      setIsFeatured(existingPost.isFeatured);
    }
  }, [existingPost, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) { setError("Titulo e conteudo sao obrigatorios"); return; }
    setSaving(true);
    setError("");

    const tagList = tags.split(",").map(t => t.trim()).filter(Boolean);
    const payload = {
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt.trim() || undefined,
      coverImageUrl: coverImageUrl.trim() || undefined,
      categoryId: categoryId || undefined,
      tags: tagList,
      isPinned,
      isFeatured,
    };

    if (mode === "create") {
      createPost.mutate(
        { data: payload },
        {
          onSuccess: (post) => {
            queryClient.invalidateQueries({ queryKey: getGetPostsQueryKey() });
            navigate(`/post/${post.slug}`);
          },
          onError: (err: any) => {
            setError(err?.data?.error ?? "Erro ao criar post");
            setSaving(false);
          },
        }
      );
    } else if (postId) {
      updatePost.mutate(
        { id: postId, data: payload },
        {
          onSuccess: (post) => {
            queryClient.invalidateQueries({ queryKey: getGetPostsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(postId) });
            navigate(`/post/${post.slug}`);
          },
          onError: (err: any) => {
            setError(err?.data?.error ?? "Erro ao atualizar post");
            setSaving(false);
          },
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-gold transition-colors font-heading">
              <ArrowLeft size={14} /> VOLTAR
            </button>
          </Link>
          <h1 className="font-heading font-bold text-xl text-gold">
            {mode === "create" ? "NOVO POST" : "EDITAR POST"}
          </h1>
        </div>
        <button
          onClick={() => setPreview(v => !v)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-heading border border-border hover:border-gold/40 hover:text-gold text-muted-foreground rounded transition-colors"
        >
          <Eye size={13} /> {preview ? "EDITOR" : "PREVIEW"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Main editor */}
        <div className="space-y-4">
          {/* Title */}
          <div className="bg-card border border-border/60 rounded-md overflow-hidden pixel-border-top">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Titulo do post..."
              className="w-full bg-transparent px-5 py-4 text-xl font-heading font-bold text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>

          {/* Content */}
          <div className="bg-card border border-border/60 rounded-md overflow-hidden pixel-border-top">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60 bg-black/20">
              <span className="text-xs font-heading text-gold uppercase tracking-wider">
                {preview ? "PREVIEW" : "CONTEUDO (MARKDOWN)"}
              </span>
            </div>
            {preview ? (
              <div className="p-6 prose-retro min-h-64">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || "*Sem conteudo ainda...*"}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Escreva o conteudo em Markdown..."
                rows={20}
                className="w-full bg-transparent px-4 py-4 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-y font-mono"
              />
            )}
          </div>
        </div>

        {/* Sidebar settings */}
        <div className="space-y-4">
          {/* Publish button */}
          <div className="bg-card border border-border/60 rounded-md overflow-hidden pixel-border-top p-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded px-3 py-2 text-xs text-destructive font-heading mb-3">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-gold hover:bg-gold/90 text-black font-heading font-bold text-sm uppercase tracking-widest rounded glow-gold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Save size={14} /> {saving ? "SALVANDO..." : mode === "create" ? "PUBLICAR" : "ATUALIZAR"}
            </button>
          </div>

          {/* Excerpt */}
          <div className="bg-card border border-border/60 rounded-md overflow-hidden pixel-border-top p-4 space-y-2">
            <label className="block text-xs font-heading text-gold uppercase tracking-wider">Resumo</label>
            <textarea
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              placeholder="Resumo do post..."
              rows={3}
              className="w-full bg-muted border border-border focus:border-gold/60 rounded px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none resize-none transition-colors"
            />
          </div>

          {/* Cover image */}
          <div className="bg-card border border-border/60 rounded-md overflow-hidden pixel-border-top p-4 space-y-2">
            <label className="block text-xs font-heading text-gold uppercase tracking-wider flex items-center gap-1"><Image size={12} /> Imagem de Capa</label>
            <input
              type="url"
              value={coverImageUrl}
              onChange={e => setCoverImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-muted border border-border focus:border-gold/60 rounded px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none transition-colors"
            />
            {coverImageUrl && (
              <img src={coverImageUrl} alt="cover preview" className="w-full h-32 object-cover rounded border border-border" onError={e => (e.currentTarget.style.display = "none")} />
            )}
          </div>

          {/* Category */}
          <div className="bg-card border border-border/60 rounded-md overflow-hidden pixel-border-top p-4 space-y-2">
            <label className="block text-xs font-heading text-gold uppercase tracking-wider">Categoria</label>
            <select
              value={categoryId ?? ""}
              onChange={e => setCategoryId(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full bg-muted border border-border focus:border-gold/60 rounded px-3 py-2 text-xs text-foreground outline-none transition-colors"
            >
              <option value="">Sem categoria</option>
              {categories?.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="bg-card border border-border/60 rounded-md overflow-hidden pixel-border-top p-4 space-y-2">
            <label className="block text-xs font-heading text-gold uppercase tracking-wider">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="w-full bg-muted border border-border focus:border-gold/60 rounded px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none transition-colors"
            />
            <p className="text-xs text-muted-foreground/60">Separadas por virgula</p>
          </div>

          {/* Options */}
          <div className="bg-card border border-border/60 rounded-md overflow-hidden pixel-border-top p-4 space-y-3">
            <label className="block text-xs font-heading text-gold uppercase tracking-wider">Opcoes</label>
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Pin size={13} className="text-muted-foreground" />
                <span className="text-sm text-foreground">Fixar post</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPinned(v => !v)}
                className={`w-10 h-5 rounded-full transition-all relative ${isPinned ? "bg-gold" : "bg-muted border border-border"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${isPinned ? "right-0.5" : "left-0.5"}`} />
              </button>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Star size={13} className="text-muted-foreground" />
                <span className="text-sm text-foreground">Destacar</span>
              </div>
              <button
                type="button"
                onClick={() => setIsFeatured(v => !v)}
                className={`w-10 h-5 rounded-full transition-all relative ${isFeatured ? "bg-gold" : "bg-muted border border-border"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${isFeatured ? "right-0.5" : "left-0.5"}`} />
              </button>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
}
