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
      <footer className="bg-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display text-2xl font-bold mb-4 text-white">ÐÐ¾Ñ‰ÑƒÐ²ÐºÐ¸<span className="text-accent">+</span></h3>
            <p className="text-white">
              Ð’Ð°ÑˆÐ¸ÑÑ‚ Ð½Ð°Ð´ÐµÐ¶Ð´ÐµÐ½ Ð¿Ð°Ñ€Ñ‚Ð½ÑŒÐ¾Ñ€ Ð·Ð° Ð»ÑƒÐºÑÐ¾Ð·Ð½Ð¸ Ð½Ð¾Ñ‰ÑƒÐ²ÐºÐ¸ Ð¸ Ð½ÐµÐ·Ð°Ð±Ñ€Ð°Ð²Ð¸Ð¼Ð¸ Ð¿Ñ€ÐµÐ¶Ð¸Ð²ÑÐ²Ð°Ð½Ð¸Ñ.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4">Ð‘ÑŠÑ€Ð·Ð¸ Ð²Ñ€ÑŠÐ·ÐºÐ¸</h4>
            <ul className="space-y-2 text-white/70">
              <li><a href="/rooms" className="hover:text-accent">Ð¡Ñ‚Ð°Ð¸</a></li>
              <li><a href="/contact" className="hover:text-accent">ÐšÐ¾Ð½Ñ‚Ð°ÐºÑ‚Ð¸</a></li>
              {/** Show admin link only for admins */}
              {user?.isAdmin && <li><a href="/admin" className="hover:text-accent">ÐÐ´Ð¼Ð¸Ð½Ð¸ÑÑ‚Ñ€Ð°Ñ†Ð¸Ñ</a></li>}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4">ÐšÐ¾Ð½Ñ‚Ð°ÐºÑ‚Ð¸</h4>
            <p className="text-white/70">
              ÐŸÐ°Ð·Ð°Ñ€Ð´Ð¶Ð¸Ðº, Ð‘ÑŠÐ»Ð³Ð°Ñ€Ð¸Ñ<br/>
              noshtuvkiplus@gmail.com<br/>
              +359 895 759 357
            </p>
          </div>
        </div>
        <div className="text-center text-white/40 mt-12 pt-8 border-t border-white/10">
          Â© 2025 ÐÐ¾Ñ‰ÑƒÐ²ÐºÐ¸+
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

