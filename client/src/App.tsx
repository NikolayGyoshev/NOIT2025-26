import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Rooms from "@/pages/Rooms";
import RoomDetails from "@/pages/RoomDetails";
import Contact from "@/pages/Contact";
import Admin from "@/pages/Admin";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import { useAuth } from "@/hooks/use-auth";
import MyReservations from "@/pages/MyReservations";

function Router() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/rooms" component={Rooms} />
          <Route path="/rooms/:id" component={RoomDetails} />
          <Route path="/contact" component={Contact} />
          <Route path="/admin" component={() => {
            const { user, isLoading } = useAuth();
            if (isLoading) return null;
            return user?.isAdmin ? <Admin /> : <NotFound />;
          }} />
          <Route path="/my-reservations" component={MyReservations} />
          <Route path="/register" component={Register} />
          <Route path="/login" component={Login} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <footer className="bg-primary text-primary-foreground py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display text-2xl font-bold mb-4 text-primary-foreground">Нощувки<span className="text-accent">+</span></h3>
            <p className="text-primary-foreground/90">
              Вашият надежден партньор за луксозни нощувки и незабравими преживявания.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4 text-primary-foreground">{"\u0411\u044a\u0440\u0437\u0438 \u0432\u0440\u044a\u0437\u043a\u0438"}</h4>
            <ul className="space-y-2 text-primary-foreground/90">
              <li><a href="/rooms" className="hover:text-accent transition-colors">Стаи</a></li>
              <li><a href="/contact" className="hover:text-accent transition-colors">{"\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u0438"}</a></li>
              {/** Show admin link only for admins */}
              {user?.isAdmin && <li><a href="/admin" className="hover:text-accent transition-colors">Администрация</a></li>}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4 text-primary-foreground">{"\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u0438"}</h4>
            <p className="text-primary-foreground/90">
              Пазарджик, България<br/>
              noshtuvkiplus@gmail.com<br/>
              +359 895 759 357
            </p>
          </div>
        </div>
        <div className="text-center text-primary-foreground/70 mt-12 pt-8 border-t border-primary-foreground/20">
          НОИТ 2025/2026 Нощувки+
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

