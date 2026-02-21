import { useReservations, useCancelReservation } from "@/hooks/use-rooms";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function MyReservations() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: reservations, isLoading, error } = useReservations();
  const cancelReservation = useCancelReservation();
  const { toast } = useToast();

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) {
    return (
      <div className="container-custom py-20 text-center">
        <h2 className="text-xl font-semibold mb-4">Трябва да влезете, за да видите резервациите си</h2>
        <div className="flex justify-center gap-2">
          <Link href="/login" className="btn btn-outline">Вход</Link>
          <Link href="/register" className="btn btn-primary">Регистрация</Link>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="container-custom py-20 text-center text-destructive">Грешка при зареждане на резервациите.</div>;
  }

  if (!reservations || reservations.length === 0) {
    return <div className="container-custom py-20 text-center">Нямате направени резервации.</div>;
  }

  return (
    <div className="container-custom py-12">
      <h1 className="text-3xl font-bold mb-8">Моите резервации</h1>
      <div className="space-y-6">
        {reservations.map((r) => (
          <div key={r.id} className="bg-card border rounded-xl shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="font-semibold text-lg">{r.room?.title || "Стая №" + r.roomId}</div>
              <div className="text-muted-foreground text-sm">{r.room?.location}</div>
              <div className="text-sm mt-2">
                <span className="font-medium">Период:</span> {format(new Date(r.startDate), "d MMM yyyy", { locale: bg })} - {format(new Date(r.endDate), "d MMM yyyy", { locale: bg })}
              </div>
              <div className="text-sm mt-1">
                <span className="font-medium">Статус:</span> {r.status === "confirmed" ? "Потвърдена" : "Отменена"}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xl font-bold text-primary">
                {(r.totalPrice / 100).toFixed(2)} €
              </div>
              {r.status === "confirmed" && (
                <Button
                  variant="outline"
                  disabled={cancelReservation.isPending}
                  onClick={async () => {
                    if (!confirm("Сигурни ли сте, че искате да отмените резервацията?") ) return;
                    try {
                      await cancelReservation.mutateAsync(r.id);
                      toast({ title: "Резервацията е отменена" });
                    } catch (e) {
                      toast({ title: "Грешка", description: (e as Error).message, variant: "destructive" });
                    }
                  }}
                >
                  Отмени
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
