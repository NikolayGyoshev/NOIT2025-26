import { useRooms } from "@/hooks/use-rooms";
import { RoomCard } from "@/components/RoomCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";
import { Loader2, Search, Filter } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Rooms() {
  const [filters, setFilters] = useState<{
    minPrice?: number;
    maxPrice?: number;
    capacity?: number;
  }>({});

  const { data: rooms, isLoading } = useRooms(filters);

  // Local state for filter inputs before applying
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [capacity, setCapacity] = useState("");

  const applyFilters = () => {
    setFilters({
      minPrice: priceRange[0] * 100, // Convert to cents
      maxPrice: priceRange[1] * 100,
      capacity: capacity ? parseInt(capacity) : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-muted/10 pb-20">
      <div className="bg-primary py-12 mb-8">
        <div className="container-custom">
          <h1 className="text-4xl font-display font-bold text-primary-foreground mb-4">Нашите Стаи</h1>
          <p className="text-primary-foreground/80 max-w-2xl">
            Изберете от нашето разнообразие от луксозни стаи и апартаменти, проектирани за вашия комфорт.
          </p>
        </div>
      </div>

      <div className="container-custom">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Mobile Filter Button */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Filter className="mr-2 h-4 w-4" />
                  Филтри
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Филтриране</SheetTitle>
                  <SheetDescription>Намерете идеалната стая за вас</SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-6">
                  <div className="space-y-4">
                    <Label>Ценови диапазон (€)</Label>
                    <Slider
                      defaultValue={[0, 500]}
                      max={1000}
                      step={10}
                      value={priceRange}
                      onValueChange={setPriceRange}
                      className="py-4"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{priceRange[0]} €</span>
                      <span>{priceRange[1]} €</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="capacity-mobile">Капацитет (гости)</Label>
                    <Input
                      id="capacity-mobile"
                      type="number"
                      placeholder="Брой гости"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                    />
                  </div>

                  <Button onClick={applyFilters} className="w-full btn-primary">
                    Приложи филтри
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 space-y-8">
            <div className="bg-card rounded-xl p-6 shadow-sm border space-y-6 sticky top-24">
              <h3 className="font-semibold text-lg">Филтри</h3>
              
              <div className="space-y-4">
                <Label>Ценови диапазон (€)</Label>
                <Slider
                  defaultValue={[0, 500]}
                  max={1000}
                  step={10}
                  value={priceRange}
                  onValueChange={setPriceRange}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{priceRange[0]} €</span>
                  <span>{priceRange[1]} €</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Капацитет (гости)</Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="Брой гости"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </div>

              <Button onClick={applyFilters} className="w-full btn-primary">
                <Search className="mr-2 h-4 w-4" />
                Търсене
              </Button>
            </div>
          </aside>

          {/* Rooms Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-[400px] rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : rooms?.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Няма намерени стаи</h3>
                <p className="text-muted-foreground">Опитайте да промените филтрите си.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {rooms?.map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
