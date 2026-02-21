import { useRoom, useCreateReservation, useReviews, useCreateReview } from "@/hooks/use-rooms";
import { useAuth } from "@/hooks/use-auth";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Users, Check, Star } from "lucide-react";
import { useState } from "react";
import { addDays, differenceInDays, format } from "date-fns";
import { bg } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";

export default function RoomDetails() {
  const { id } = useParams<{ id: string }>();
  const roomId = parseInt(id);
  
  const { data: room, isLoading } = useRoom(roomId);
  const { data: reviews } = useReviews(roomId);
  const { user } = useAuth();
  const { toast } = useToast();
  const createReservation = useCreateReservation();
  const createReview = useCreateReview();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 3),
  });

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const handleBooking = async () => {
    if (!user) {
      toast({
        title: "Изисква се вход",
        description: "Моля, влезте в профила си, за да направите резервация.",
        variant: "destructive",
      });
      setTimeout(() => window.location.href = "/login", 1000);
      return;
    }

    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: "Изберете дати",
        description: "Моля, изберете начална и крайна дата за престоя.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createReservation.mutateAsync({
        roomId,
        startDate: dateRange.from,
        endDate: dateRange.to,
      });
      
      toast({
        title: "Успешна резервация!",
        description: "Вашата резервация е потвърдена.",
      });
    } catch (error) {
      toast({
        title: "Грешка",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!room) {
    return <div className="container-custom py-20 text-center">Стаята не е намерена.</div>;
  }

  const days = dateRange?.from && dateRange?.to 
    ? differenceInDays(dateRange.to, dateRange.from) 
    : 0;
  
  const totalPrice = days * room.price;
  const averageRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Image */}
        <div className="relative h-[50vh] w-full overflow-hidden">
          <div className="absolute inset-0 bg-black/50 z-10" />
        <img
          src={room.imageUrl || "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2070&auto=format&fit=crop"}
          alt={room.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 p-8 z-20 bg-gradient-to-t from-black/90 to-transparent">
          <div className="container-custom">
            <h1 className="text-4xl md:text-6xl font-display font-semibold tracking-wide text-white drop-shadow-xl mb-2">
              {room.title}
            </h1>
            <div className="flex items-center text-white/90 uppercase tracking-[0.18em] text-xs md:text-sm">
              <MapPin className="h-5 w-5 mr-2" />
              <span>{room.location}</span>
            </div>
            {averageRating !== null && (
              <div className="flex items-center gap-2 text-white/90 mt-2 tracking-wide">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.round(averageRating) ? "fill-current" : "text-white/40"}`} />
                  ))}
                </div>
                <span className="text-xs md:text-sm uppercase tracking-[0.18em]">{averageRating.toFixed(1)} / 5</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container-custom py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            <div className="rounded-2xl border border-border/40 bg-white/70 shadow-sm backdrop-blur-md p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-display font-semibold tracking-wide mb-4 text-foreground/90">
                Описание
              </h2>
              <p className="text-muted-foreground/90 leading-relaxed text-lg tracking-wide">
                {room.description}
              </p>
            </div>

            <div className="rounded-2xl border border-border/40 bg-white/70 shadow-sm backdrop-blur-md p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-display font-semibold tracking-wide mb-6 text-foreground/90">
                Удобства
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(room.features || []).filter(Boolean).map((feature, idx) => (
                  <div key={idx} className="flex items-center space-x-3 p-4 rounded-xl bg-gradient-to-br from-white to-secondary/20 border border-border/40">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-xs md:text-sm tracking-[0.12em] uppercase text-foreground/90">{feature}</span>
                  </div>
                ))}
                <div className="flex items-center space-x-3 p-4 rounded-xl bg-gradient-to-br from-white to-secondary/20 border border-border/40">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-xs md:text-sm tracking-[0.12em] uppercase text-foreground/90">До {room.capacity} гости</span>
                </div>
                {(room.features || []).filter(Boolean).length === 0 && (
                  <div className="col-span-2 md:col-span-4 text-muted-foreground/80">
                    Няма добавени удобства.
                  </div>
                )}
              </div>
            </div>

            {/* Reviews Section */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Отзиви</h2>
              {user ? (
                <div className="bg-card p-6 rounded-xl border shadow-sm mb-6">
                  <h3 className="font-semibold mb-3">Оцени стаята</h3>
                  <div className="flex items-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1"
                        aria-label={`Оценка ${star}`}
                      >
                        <Star className={`h-6 w-6 ${star <= rating ? "fill-current text-yellow-400" : "text-muted-foreground"}`} />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Споделете впечатленията си..."
                    rows={4}
                  />
                  <div className="mt-4">
                    <Button
                      className="btn-primary"
                      disabled={createReview.isPending || comment.trim().length < 3}
                      onClick={async () => {
                        try {
                          await createReview.mutateAsync({
                            roomId,
                            data: { rating, comment: comment.trim() },
                          });
                          toast({ title: "Благодарим за отзива!" });
                          setComment("");
                          setRating(5);
                        } catch (e) {
                          toast({ title: "Грешка", description: (e as Error).message, variant: "destructive" });
                        }
                      }}
                    >
                      Изпрати отзив
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground mb-6">Влезте в профила си, за да оставите отзив.</p>
              )}
              <div className="space-y-6">
                {reviews?.length === 0 ? (
                  <p className="text-muted-foreground italic">Все още няма отзиви за тази стая.</p>
                ) : (
                  reviews?.map((review) => (
                    <div key={review.id} className="bg-card p-6 rounded-xl border shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>{review.user.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{review.user.username}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(review.createdAt!), "d MMMM yyyy", { locale: bg })}</p>
                          </div>
                        </div>
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? "fill-current" : "text-gray-300"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card border rounded-xl shadow-lg p-6 space-y-6">
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-bold text-primary">{(room.price / 100).toFixed(2)} €</span>
                <span className="text-muted-foreground">/ нощувка</span>
              </div>

              <div className="border rounded-lg p-4 bg-muted/10">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                  className="rounded-md border bg-white"
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const checkDate = new Date(date);
                    checkDate.setHours(0, 0, 0, 0);
                    return checkDate < today;
                  }}
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span>{(room.price / 100).toFixed(2)} € x {days} нощувки</span>
                  <span className="font-medium">{(totalPrice / 100).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Общо</span>
                  <span>{(totalPrice / 100).toFixed(2)} €</span>
                </div>
              </div>

              <Button 
                onClick={handleBooking} 
                className="w-full btn-primary h-12 text-lg"
                disabled={createReservation.isPending || days === 0}
              >
                {createReservation.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  "Резервирай сега"
                )}
              </Button>
              
              {!user && (
                <p className="text-xs text-center text-muted-foreground">
                  Трябва да влезете в профила си, за да резервирате.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
