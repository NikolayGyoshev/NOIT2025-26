import { Link } from "wouter";
import type { Room } from "@shared/schema";
import { Users, Euro } from "lucide-react";
import { Button } from "./ui/button";

interface RoomCardProps {
  room: Room;
}

export function RoomCard({ room }: RoomCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col h-full">
      <div className="relative aspect-[4/3] overflow-hidden">
        {/* Darker gradient overlay for improved text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
        <img
          src={room.imageUrl || "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070&auto=format&fit=crop"}
          alt={room.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute bottom-4 left-4 z-20">
          <div className="rounded-md bg-black/60 px-3 py-2 text-white">
            <h3 className="font-display text-xl font-bold text-white">{room.title}</h3>
            <p className="text-sm text-white/70">{room.location}</p>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col flex-grow p-4 space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2 flex-grow">
          {room.description}
        </p>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-muted-foreground">
            <Users className="mr-1 h-4 w-4" />
            <span>Капацитет: {room.capacity}</span>
          </div>
          <div className="font-semibold text-primary text-lg">
            {(room.price / 100).toFixed(2)} €
            <span className="text-xs font-normal text-muted-foreground"> / нощувка</span>
          </div>
        </div>

        <div className="pt-2">
          <Button asChild className="w-full btn-primary">
            <Link href={`/rooms/${room.id}`}>Виж детайли</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
