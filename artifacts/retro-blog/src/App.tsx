import { Suspense, lazy, Component, type ReactNode } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout/Layout";
import { Loader2 } from "lucide-react";

const Home = lazy(() => import("@/pages/Home").then(m => ({ default: m.Home })));
const PostDetail = lazy(() => import("@/pages/PostDetail").then(m => ({ default: m.PostDetail })));
const Login = lazy(() => import("@/pages/Login").then(m => ({ default: m.Login })));
const Register = lazy(() => import("@/pages/Register").then(m => ({ default: m.Register })));
const CategoryPage = lazy(() => import("@/pages/CategoryPage").then(m => ({ default: m.CategoryPage })));
const SearchPage = lazy(() => import("@/pages/SearchPage").then(m => ({ default: m.SearchPage })));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard").then(m => ({ default: m.AdminDashboard })));
const PostEditor = lazy(() => import("@/pages/admin/PostEditor").then(m => ({ default: m.PostEditor })));
const AdminCategories = lazy(() => import("@/pages/admin/Categories").then(m => ({ default: m.AdminCategories })));
const AdminComments = lazy(() => import("@/pages/admin/Comments").then(m => ({ default: m.AdminComments })));
const AdminUsers = lazy(() => import("@/pages/admin/Users").then(m => ({ default: m.AdminUsers })));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-gold" size={28} />
    </div>
  );
}

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-8">
          <div className="text-center max-w-md">
            <p className="font-title text-gold text-2xl mb-4 glow-gold-text">[ ERRO ]</p>
            <p className="font-heading text-sm text-muted-foreground mb-6">
              Ocorreu um erro inesperado. Tente recarregar a pagina.
            </p>
            <button
              onClick={() => window.location.href = "/"}
              className="px-6 py-3 bg-gold/10 hover:bg-gold/20 border border-gold/40 hover:border-gold text-gold font-heading font-bold text-sm uppercase tracking-widest rounded transition-all duration-200"
            >
              Voltar ao Inicio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <PageLoader />;
  if (!user || !isAdmin()) return (
    <div className="text-center py-20">
      <p className="font-heading text-destructive text-sm mb-4">Acesso negado — requer permissao de admin</p>
      <a href="/login" className="text-gold underline text-sm">Entrar</a>
    </div>
  );
  return <>{children}</>;
}

function OwnerGuard({ children }: { children: ReactNode }) {
  const { user, loading, isOwner } = useAuth();
  if (loading) return <PageLoader />;
  if (!user || !isOwner()) return (
    <div className="text-center py-20">
      <p className="font-heading text-destructive text-sm">Acesso negado — requer permissao de owner</p>
    </div>
  );
  return <>{children}</>;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/">
          <Lazy><Home /></Lazy>
        </Route>
        <Route path="/post/:slug">
          <Lazy><PostDetail /></Lazy>
        </Route>
        <Route path="/category/:slug">
          <Lazy><CategoryPage /></Lazy>
        </Route>
        <Route path="/search">
          <Lazy><SearchPage /></Lazy>
        </Route>
        <Route path="/login">
          <Lazy><Login /></Lazy>
        </Route>
        <Route path="/register">
          <Lazy><Register /></Lazy>
        </Route>
        <Route path="/admin">
          <Lazy>
            <AdminGuard><AdminDashboard /></AdminGuard>
          </Lazy>
        </Route>
        <Route path="/admin/posts/new">
          <Lazy>
            <AdminGuard><PostEditor mode="create" /></AdminGuard>
          </Lazy>
        </Route>
        <Route path="/admin/posts/:id/edit">
          <Lazy>
            <AdminGuard><PostEditor mode="edit" /></AdminGuard>
          </Lazy>
        </Route>
        <Route path="/admin/categories">
          <Lazy>
            <AdminGuard><AdminCategories /></AdminGuard>
          </Lazy>
        </Route>
        <Route path="/admin/comments">
          <Lazy>
            <AdminGuard><AdminComments /></AdminGuard>
          </Lazy>
        </Route>
        <Route path="/admin/users">
          <Lazy>
            <OwnerGuard><AdminUsers /></OwnerGuard>
          </Lazy>
        </Route>
        <Route>
          <Lazy><NotFound /></Lazy>
        </Route>
      </Switch>
    </Layout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
