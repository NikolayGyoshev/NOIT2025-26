import { useRooms } from "@/hooks/use-rooms";
import { RoomCard } from "@/components/RoomCard";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Loader2, Calendar, MapPin, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { data: rooms, isLoading } = useRooms();

  // Show only featured or first 3 rooms
  const featuredRooms = rooms?.slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/40 z-10" />
          {/* Unsplash: Luxury hotel room with view */}
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop"
            alt="Hero background"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg"
          >
            Изживейте лукса на <br/> Нощувки<span className="text-accent">+</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-100 mb-8 max-w-2xl mx-auto font-light"
          >
            Открийте идеалното място за вашата почивка. Комфорт, стил и незабравими гледки.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full bg-accent hover:bg-accent/90 text-primary font-bold">
              <Link href="/rooms">Резервирай сега</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Топ Локации</h3>
              <p className="text-muted-foreground">Разположени в сърцето на най-красивите градове и курорти.</p>
            </div>
            <div className="p-6 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Премиум Обслужване</h3>
              <p className="text-muted-foreground">24/7 консиерж услуги и внимание към всеки детайл.</p>
            </div>
            <div className="p-6 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Лесна Резервация</h3>
              <p className="text-muted-foreground">Бърз и сигурен процес на резервация само с няколко клика.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Rooms */}
      <section className="py-20 bg-muted/30">
        <div className="container-custom">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-primary mb-2">Популярни Стаи</h2>
              <p className="text-muted-foreground">Избрани предложения за вашия престой</p>
            </div>
            <Button asChild variant="outline" className="hidden md:flex">
              <Link href="/rooms">Виж всички</Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredRooms?.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          )}
          
          <div className="mt-8 text-center md:hidden">
            <Button asChild variant="outline" className="w-full">
              <Link href="/rooms">Виж всички стаи</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="container-custom relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Готови ли сте за почивка?</h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Не отлагайте заслужената почивка. Запазете своята стая днес и се насладете на незабравими моменти.
          </p>
          <Button asChild size="lg" className="bg-accent text-primary hover:bg-accent/90 font-bold px-8">
            <Link href="/rooms">Намерете стая</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
