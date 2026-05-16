export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-card/80 border-t border-border/60 mt-12">
      <div className="border-t-2 border-gold/30" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-title text-gold text-xs mb-3 glow-gold-text">NEXUS GAMER</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              O portal definitivo para noticias, reviews e cultura gamer e anime.
              Feito com paixao por fas para fas.
            </p>
          </div>
          <div>
            <h4 className="font-heading text-gold text-xs uppercase tracking-wider mb-3">Links Rapidos</h4>
            <ul className="space-y-1.5">
              {["Inicio", "Noticias", "Reviews", "Animes", "Retro Games"].map(l => (
                <li key={l}>
                  <span className="text-xs text-muted-foreground hover:text-gold transition-colors cursor-pointer">{l}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-heading text-gold text-xs uppercase tracking-wider mb-3">Comunidade</h4>
            <ul className="space-y-1.5">
              {["Discord", "Twitter/X", "YouTube", "Instagram"].map(l => (
                <li key={l}>
                  <span className="text-xs text-muted-foreground hover:text-gold transition-colors cursor-pointer">{l}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-border/40 mt-6 pt-4 text-center">
          <p className="text-xs text-muted-foreground font-heading">
            &copy; {year} NEXUS GAMER — TODOS OS DIREITOS RESERVADOS
          </p>
          <p className="text-xs text-muted-foreground/40 mt-1">
            Feito com amor e nostalgia
          </p>
        </div>
      </div>
    </footer>
  );
}
