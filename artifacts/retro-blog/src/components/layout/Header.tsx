import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Search, LogIn, LogOut, User, Shield, Menu, X, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useGetOnlineCount, useGetNotifications, useMarkNotificationsRead } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import socket from "@/lib/socket";

interface HeaderProps {
  onMenuToggle: () => void;
  menuOpen: boolean;
}

export function Header({ onMenuToggle, menuOpen }: HeaderProps) {
  const { user, logout, isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();
  const [onlineCount, setOnlineCount] = useState(0);
  const queryClient = useQueryClient();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const { data: onlineData } = useGetOnlineCount();
  // Only fetch notifications when user is authenticated
  const { data: notifications } = useGetNotifications({
    query: { enabled: !!user },
  } as any);
  const markRead = useMarkNotificationsRead();

  useEffect(() => {
    if (onlineData?.count !== undefined) setOnlineCount(onlineData.count);
  }, [onlineData]);

  useEffect(() => {
    socket.on("online_count", (data: { count: number }) => setOnlineCount(data.count));
    return () => { socket.off("online_count"); };
  }, []);

  const unreadCount = (notifications as any[])?.filter((n: any) => !n.isRead).length ?? 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/search?q=${encodeURIComponent(search.trim())}`);
  };

  const handleNotifClick = () => {
    setNotifOpen(v => !v);
    if (unreadCount > 0) {
      markRead.mutate();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="relative z-50 bg-card/95 backdrop-blur-sm border-b border-border/60 scanlines">
      {/* Top bar */}
      <div className="border-b border-gold/20 bg-black/30">
        <div className="max-w-7xl mx-auto px-4 py-1 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-heading">
            NEXUS GAMER — PORTAL DE NOTICIAS
          </span>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-400 font-heading">{onlineCount} online</span>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          {/* Mobile menu toggle */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden text-muted-foreground hover:text-gold transition-colors p-1"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 bg-gold/10 border-2 border-gold rounded flex items-center justify-center glow-gold">
              <span className="font-title text-gold text-xs">N</span>
            </div>
            <div>
              <h1 className="font-title text-gold text-sm glow-gold-text leading-tight">NEXUS</h1>
              <p className="font-heading text-xs text-muted-foreground tracking-widest">GAMER BLOG</p>
            </div>
          </Link>

          {/* Nav links (desktop) */}
          <nav className="hidden lg:flex items-center gap-1 ml-4">
            {[
              { href: "/", label: "HOME" },
              { href: "/category/noticias", label: "NOTICIAS" },
              { href: "/category/reviews", label: "REVIEWS" },
              { href: "/category/animes", label: "ANIMES" },
              { href: "/category/retro-games", label: "RETRO" },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-xs font-heading font-bold text-muted-foreground hover:text-gold hover:bg-gold/5 rounded transition-all duration-150 tracking-wider"
              >
                {link.label}
              </Link>
            ))}
            {isAdmin() && (
              <Link href="/admin" className="px-3 py-1.5 text-xs font-heading font-bold text-accent hover:bg-accent/10 rounded transition-all duration-150 tracking-wider flex items-center gap-1">
                <Shield size={12} /> ADMIN
              </Link>
            )}
          </nav>

          <div className="flex-1" />

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden sm:flex items-center">
            <div className="flex items-center bg-muted border border-border rounded overflow-hidden focus-within:border-gold/50 transition-colors">
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Pesquisar..."
                className="bg-transparent text-sm px-3 py-1.5 outline-none text-foreground placeholder:text-muted-foreground w-44 font-sans"
              />
              <button type="submit" className="px-2 py-1.5 text-muted-foreground hover:text-gold transition-colors">
                <Search size={15} />
              </button>
            </div>
          </form>

          {/* Auth + notifications */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Notifications */}
                <div ref={notifRef} className="relative">
                  <button
                    onClick={handleNotifClick}
                    className="relative p-1.5 text-muted-foreground hover:text-gold transition-colors"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                  {/* Dropdown — pure CSS, no AnimatePresence */}
                  <div
                    className={`absolute right-0 top-9 w-72 bg-popover border border-border rounded shadow-xl z-50 overflow-hidden transition-all duration-200 origin-top-right ${
                      notifOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
                    }`}
                  >
                    <div className="px-3 py-2 border-b border-border font-heading text-xs text-gold">NOTIFICACOES</div>
                    <div className="max-h-64 overflow-y-auto">
                      {!(notifications as any[])?.length ? (
                        <p className="px-3 py-4 text-xs text-muted-foreground text-center">Nenhuma notificacao</p>
                      ) : (notifications as any[]).map((n: any) => (
                        <div key={n.id} className={`px-3 py-2 border-b border-border/40 text-xs ${n.isRead ? "text-muted-foreground" : "text-foreground"}`}>
                          <p>{n.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* User badge */}
                <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded border border-border">
                  <User size={13} className="text-gold" />
                  <span className="text-xs font-heading text-foreground max-w-24 truncate">{user.username}</span>
                  {(user.role === "ADMIN" || user.role === "OWNER") && (
                    <span className="text-xs bg-gold/20 text-gold px-1.5 py-0.5 rounded font-bold font-heading">{user.role}</span>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-heading text-muted-foreground hover:text-destructive border border-border hover:border-destructive/50 rounded transition-all duration-150"
                >
                  <LogOut size={13} /> SAIR
                </button>
              </>
            ) : (
              <Link href="/login">
                <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-heading text-gold border border-gold/50 hover:bg-gold/10 rounded transition-all duration-150">
                  <LogIn size={13} /> ENTRAR
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
