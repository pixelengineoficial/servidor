import { useState } from "react";
import { useGetCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, getGetCategoriesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";

export function AdminCategories() {
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useGetCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState("#D4A853");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createCategory.mutate(
      { data: { name: newName.trim(), description: newDesc.trim() || undefined, color: newColor } },
      {
        onSuccess: () => {
          setNewName(""); setNewDesc(""); setNewColor("#D4A853");
          queryClient.invalidateQueries({ queryKey: getGetCategoriesQueryKey() });
        },
      }
    );
  };

  const handleUpdate = (id: number) => {
    updateCategory.mutate(
      { id, data: { name: editName, color: editColor } },
      {
        onSuccess: () => {
          setEditingId(null);
          queryClient.invalidateQueries({ queryKey: getGetCategoriesQueryKey() });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Excluir esta categoria?")) return;
    deleteCategory.mutate({ id } as any, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCategoriesQueryKey() }),
    });
  };

  return (
    <div className="space-y-8">
      <h1 className="font-heading font-bold text-2xl text-gold">CATEGORIAS</h1>

      {/* Create form */}
      <div className="bg-card border border-border/60 rounded-md overflow-hidden pixel-border-top p-6">
        <h2 className="font-heading text-xs font-bold text-gold uppercase tracking-wider mb-4">Nova Categoria</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-40">
            <label className="block text-xs text-muted-foreground mb-1">Nome</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome..." className="w-full bg-muted border border-border focus:border-gold/60 rounded px-3 py-2 text-sm text-foreground outline-none transition-colors" />
          </div>
          <div className="flex-1 min-w-40">
            <label className="block text-xs text-muted-foreground mb-1">Descricao</label>
            <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Descricao..." className="w-full bg-muted border border-border focus:border-gold/60 rounded px-3 py-2 text-sm text-foreground outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Cor</label>
            <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-10 h-9 rounded border border-border cursor-pointer bg-muted" />
          </div>
          <button type="submit" disabled={createCategory.isPending} className="flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold/90 text-black font-heading font-bold text-xs uppercase rounded transition-all disabled:opacity-60">
            <Plus size={14} /> Criar
          </button>
        </form>
      </div>

      {/* Categories list */}
      <div className="bg-card border border-border/60 rounded-md overflow-hidden pixel-border-top">
        <div className="px-4 py-3 border-b border-border/60 bg-black/20">
          <h2 className="font-heading text-xs font-bold text-gold uppercase tracking-wider">Categorias Existentes</h2>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-12 rounded" />)}</div>
        ) : (
          <div className="divide-y divide-border/40">
            {categories?.map(cat => (
              <div key={cat.id} className="flex items-center gap-4 px-4 py-3">
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color ?? "#D4A853" }} />
                {editingId === cat.id ? (
                  <>
                    <input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 bg-muted border border-gold/40 rounded px-2 py-1 text-sm text-foreground outline-none" />
                    <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-muted border border-border" />
                    <button onClick={() => handleUpdate(cat.id)} className="text-green-400 hover:text-green-300 transition-colors"><Check size={15} /></button>
                    <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={15} /></button>
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <span className="text-sm text-foreground font-medium">{cat.name}</span>
                      {cat.description && <span className="text-xs text-muted-foreground ml-2">{cat.description}</span>}
                    </div>
                    <span className="text-xs font-heading text-muted-foreground">{cat.postCount ?? 0} posts</span>
                    <button onClick={() => { setEditingId(cat.id); setEditName(cat.name); setEditColor(cat.color ?? "#D4A853"); }} className="text-muted-foreground hover:text-gold transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(cat.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
