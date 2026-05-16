import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";
import socket from "@/lib/socket";
import { useQueryClient } from "@tanstack/react-query";
import { getGetPostsQueryKey } from "@workspace/api-client-react";
import type { Post } from "@workspace/api-client-react";

interface NewPostNotification {
  id: number;
  title: string;
  slug: string;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const [newPostNotif, setNewPostNotif] = useState<NewPostNotification | null>(null);
  const [notifVisible, setNotifVisible] = useState(false);
  const queryClient = useQueryClient();
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Listen for real-time new posts
  useEffect(() => {
    socket.on("new_post", (post: Post) => {
      setNewPostNotif({ id: post.id, title: post.title, slug: post.slug });
      setNotifVisible(true);
      queryClient.invalidateQueries({ queryKey: getGetPostsQueryKey() });
      if (notifTimer.current) clearTimeout(notifTimer.current);
      notifTimer.current = setTimeout(() => {
        setNotifVisible(false);
        setTimeout(() => setNewPostNotif(null), 400);
      }, 6000);
    });
    return () => {
      socket.off("new_post");
      if (notifTimer.current) clearTimeout(notifTimer.current);
    };
  }, [queryClient]);

  const isAdminRoute = location.startsWith("/admin");

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      <Header onMenuToggle={() => setMenuOpen(v => !v)} menuOpen={menuOpen} />

      {/* Mobile sidebar overlay — pure CSS, no framer-motion */}
      <div
        aria-hidden={!menuOpen}
        className={`fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity duration-200 ${menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setMenuOpen(false)}
      />
      <div
        className={`fixed left-0 top-0 bottom-0 w-72 bg-card border-r border-border z-50 lg:hidden overflow-y-auto pt-20 px-4 pb-8 transition-transform duration-250 ease-in-out ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Sidebar />
      </div>

      {/* New post notification banner — pure CSS */}
      {newPostNotif && (
        <div
          className={`fixed top-[72px] left-0 right-0 z-50 mx-auto max-w-2xl px-4 transition-all duration-400 ${notifVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full"}`}
        >
          <a href={`/post/${newPostNotif.slug}`}>
            <div className="bg-gold/95 text-black px-4 py-3 rounded-b shadow-lg flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="font-title text-xs animate-pulse">★</span>
                <div>
                  <span className="font-heading font-bold text-xs uppercase tracking-wider">Nova Postagem!</span>
                  <p className="text-sm font-medium line-clamp-1">{newPostNotif.title}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setNotifVisible(false);
                  setTimeout(() => setNewPostNotif(null), 400);
                }}
                className="text-black/60 hover:text-black text-lg leading-none"
              >
                ×
              </button>
            </div>
          </a>
        </div>
      )}

      <main className="flex-1">
        {isAdminRoute ? (
          <div className="max-w-7xl mx-auto px-4 py-8">
            {children}
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
              <div>{children}</div>
              <div className="hidden lg:block">
                <div className="sticky top-6 max-h-[calc(100vh-5rem)] overflow-y-auto sidebar-scroll">
                  <Sidebar />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
