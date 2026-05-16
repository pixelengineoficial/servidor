import { useState } from "react";
import { Link } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Eye, EyeOff, UserPlus } from "lucide-react";

export function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const registerMut = useRegister();
  const { login: authLogin } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    registerMut.mutate(
      { data: { username, email, password } },
      {
        onSuccess: (data) => {
          authLogin(data.token, data.user as any);
          window.location.href = "/";
        },
        onError: (err: any) => {
          setError(err?.data?.error ?? "Erro ao criar conta");
        },
      }
    );
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 border-2 border-gold rounded mb-4 glow-gold">
            <span className="font-title text-gold text-lg">N</span>
          </div>
          <h1 className="font-heading font-bold text-2xl text-gold glow-gold-text">CRIAR CONTA</h1>
          <p className="text-xs text-muted-foreground mt-1 font-heading tracking-wider">JUNTE-SE A COMUNIDADE</p>
        </div>

        <div className="bg-card border border-border/60 rounded-md overflow-hidden pixel-border-top p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-heading text-gold mb-1.5 uppercase tracking-wider">Nome de usuario</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                minLength={3}
                className="w-full bg-muted border border-border focus:border-gold/60 rounded px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors"
                placeholder="seuusuario"
              />
            </div>

            <div>
              <label className="block text-xs font-heading text-gold mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-muted border border-border focus:border-gold/60 rounded px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-xs font-heading text-gold mb-1.5 uppercase tracking-wider">Senha</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-muted border border-border focus:border-gold/60 rounded px-3 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors"
                  placeholder="minimo 6 caracteres"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold transition-colors">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded px-3 py-2 text-xs text-destructive font-heading">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={registerMut.isPending}
              className="w-full py-3 bg-gold hover:bg-gold/90 text-black font-heading font-bold text-sm uppercase tracking-widest rounded transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 glow-gold"
            >
              {registerMut.isPending ? "CRIANDO..." : <><UserPlus size={14} /> CRIAR CONTA</>}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Ja tem conta?{" "}
              <Link href="/login" className="text-gold underline hover:text-gold/80">Entrar</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
