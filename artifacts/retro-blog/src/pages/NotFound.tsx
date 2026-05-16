import { Link } from "wouter";

export default function NotFound() {
  return (
    <div
      className="min-h-[70vh] flex flex-col items-center justify-center text-center"
    >
      <div className="mb-8">
        <p className="font-title text-gold text-2xl sm:text-4xl mb-4 glow-gold-text">404</p>
        <div className="text-xs font-heading text-muted-foreground/60 mb-2">[ PAGINA NAO ENCONTRADA ]</div>
        <p className="font-heading text-lg text-muted-foreground">
          Esta pagina se perdeu no hiperespaco
        </p>
        <p className="text-sm text-muted-foreground/60 mt-2">
          A URL que voce procura nao existe neste portal
        </p>
      </div>

      <div className="font-mono text-xs text-muted-foreground/40 mb-8 max-w-xs">
        <div>ERROR: 0x404</div>
        <div>LOCATION: NULL</div>
        <div>STATUS: NOT_FOUND</div>
      </div>

      <Link href="/">
        <button className="px-6 py-3 bg-gold/10 hover:bg-gold/20 border border-gold/40 hover:border-gold text-gold font-heading font-bold text-sm uppercase tracking-widest rounded transition-all duration-200 glow-gold">
          Voltar ao Portal
        </button>
      </Link>
    </div>
  );
}
