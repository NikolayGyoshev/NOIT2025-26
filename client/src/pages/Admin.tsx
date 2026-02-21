import { useAuth } from "@/hooks/use-auth";
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom, useReservations } from "@/hooks/use-rooms";
import { useContactMessages, useReplyContactMessage } from "@/hooks/use-contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Loader2, Plus, Edit, Trash, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRoomSchema, type InsertRoom } from "@shared/routes";
import { z } from "zod";

// Admin page for managing rooms and reservations
// Note: In a real app, you would check if user.isAdmin on the backend and frontend

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: rooms, isLoading: roomsLoading } = useRooms();
  const { data: reservations, isLoading: resLoading } = useReservations();
  const { data: contactMessages, isLoading: contactLoading, refetch: refetchContacts } = useContactMessages();
  
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();
  const replyContact = useReplyContactMessage();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyTarget, setReplyTarget] = useState<any>(null);

  // Form handling
  const formSchema = insertRoomSchema.extend({
    price: z.coerce.number(),
    capacity: z.coerce.number(),
    features: z.string().transform(str => str.split(',').map(s => s.trim()).filter(Boolean)), // Simple comma separated string to array
  });

  const { register, handleSubmit, reset, setValue } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (result) {
        setValue("imageUrl", result);
      }
    };
    reader.readAsDataURL(file);
  };

  if (authLoading || roomsLoading || resLoading || contactLoading) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin" /></div>;
  }

  if (!user) {
    window.location.href = "/";
    return null;
  }

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        price: Math.round(Number(data.price) * 100),
      };
      if (editingRoom) {
        await updateRoom.mutateAsync({ id: editingRoom.id, ...payload });
        toast({ title: "Стаята е обновена" });
      } else {
        await createRoom.mutateAsync(payload);
        toast({ title: "Стаята е създадена" });
      }
      setIsDialogOpen(false);
      setEditingRoom(null);
      reset();
    } catch (error) {
      toast({ title: "Грешка", description: (error as Error).message, variant: "destructive" });
    }
  };

  const openEdit = (room: any) => {
    setEditingRoom(room);
    setValue("title", room.title);
    setValue("description", room.description);
    setValue("price", room.price / 100);
    setValue("capacity", room.capacity);
    setValue("location", room.location);
    setValue("imageUrl", room.imageUrl);
    setValue("features", room.features ? room.features.join(", ") : "");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Сигурни ли сте, че искате да изтриете тази стая?")) {
      await deleteRoom.mutateAsync(id);
      toast({ title: "Стаята е изтрита" });
    }
  };

  const openReply = (message: any) => {
    setReplyTarget(message);
    setReplyMessage(message.replyMessage || "");
    setReplyDialogOpen(true);
  };

  const submitReply = async () => {
    if (!replyTarget) return;
    try {
      await replyContact.mutateAsync({ id: replyTarget.id, replyMessage });
      toast({ title: "Отговорът е изпратен" });
      setReplyDialogOpen(false);
      setReplyTarget(null);
      setReplyMessage("");
    } catch (error) {
      toast({ title: "Грешка", description: (error as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="container-custom py-12 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold font-display">Административен Панел</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingRoom(null); reset(); }} className="btn-primary">
              <Plus className="mr-2 h-4 w-4" /> Добави Стая
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRoom ? "Редактирай Стая" : "Добави Нова Стая"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Заглавие</Label>
                  <Input {...register("title")} placeholder="Луксозен Апартамент" />
                </div>
                <div className="space-y-2">
                  <Label>Локация</Label>
                  <Input {...register("location")} placeholder="София, Център" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Описание</Label>
                <Textarea {...register("description")} placeholder="Подробно описание на стаята..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Цена (евро)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register("price")}
                    placeholder="120.00 €"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Капацитет</Label>
                  <Input type="number" {...register("capacity")} placeholder="2" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Изображение URL</Label>
                <Input {...register("imageUrl")} placeholder="https://..." />
                <div className="space-y-2">
                  <Label>Или качете снимка</Label>
                  <Input type="file" accept="image/*" onChange={handleImageUpload} />
                  <p className="text-xs text-muted-foreground">
                    Избраната снимка се записва директно към стаята.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Екстри (разделени със запетая)</Label>
                <Input {...register("features")} placeholder="Wi-Fi, Закуска, Паркинг" />
              </div>

              <Button type="submit" className="w-full btn-primary" disabled={createRoom.isPending || updateRoom.isPending}>
                {createRoom.isPending || updateRoom.isPending ? <Loader2 className="animate-spin" /> : "Запази"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="rooms" className="w-full">
        <TabsList className="mb-8 w-full justify-start">
          <TabsTrigger value="rooms">Стаи</TabsTrigger>
          <TabsTrigger value="reservations">Резервации</TabsTrigger>
          <TabsTrigger value="messages">Съобщения</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms">
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Име</th>
                    <th className="px-6 py-4">Локация</th>
                    <th className="px-6 py-4">Цена</th>
                    <th className="px-6 py-4">Капацитет</th>
                    <th className="px-6 py-4">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms?.map((room) => (
                    <tr key={room.id} className="border-b hover:bg-muted/10">
                      <td className="px-6 py-4">{room.id}</td>
                      <td className="px-6 py-4 font-medium">{room.title}</td>
                      <td className="px-6 py-4">{room.location}</td>
                      <td className="px-6 py-4">{(room.price / 100).toFixed(2)} €</td>
                      <td className="px-6 py-4">{room.capacity}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(room)}>
                          <Edit className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(room.id)}>
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reservations">
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Стая</th>
                    <th className="px-6 py-4">Период</th>
                    <th className="px-6 py-4">Цена</th>
                    <th className="px-6 py-4">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations?.map((res) => (
                    <tr key={res.id} className="border-b hover:bg-muted/10">
                      <td className="px-6 py-4">{res.id}</td>
                      <td className="px-6 py-4 font-medium">{res.room.title}</td>
                      <td className="px-6 py-4">
                        {new Date(res.startDate).toLocaleDateString()} - {new Date(res.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">{(res.totalPrice / 100).toFixed(2)} €</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          res.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                          res.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100'
                        }`}>
                          {res.status === 'confirmed' ? 'Потвърдена' : 'Отказана'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {reservations?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        Няма намерени резервации.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="messages">
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Име</th>
                    <th className="px-6 py-4">Имейл</th>
                    <th className="px-6 py-4">Тема</th>
                    <th className="px-6 py-4">Съобщение</th>
                    <th className="px-6 py-4">Статус</th>
                    <th className="px-6 py-4">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {contactMessages?.map((msg) => (
                    <tr key={msg.id} className="border-b hover:bg-muted/10">
                      <td className="px-6 py-4">{msg.id}</td>
                      <td className="px-6 py-4 font-medium">{msg.name}</td>
                      <td className="px-6 py-4">{msg.email}</td>
                      <td className="px-6 py-4">{msg.subject}</td>
                      <td className="px-6 py-4 max-w-md">
                        <div className="line-clamp-2">{msg.message}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(msg.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {msg.replyMessage ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">Отговорено</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">Ново</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Button variant="outline" size="sm" onClick={() => openReply(msg)}>
                          Отговори
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {contactMessages?.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                        Няма нови съобщения.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => refetchContacts()}>
              Обнови
            </Button>
          </div>

          <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Отговор на съобщение</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <div><span className="font-medium">От:</span> {replyTarget?.name} ({replyTarget?.email})</div>
                  <div><span className="font-medium">Тема:</span> {replyTarget?.subject}</div>
                  <div className="mt-2 p-3 border rounded-md bg-muted/10">
                    {replyTarget?.message}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Отговор</Label>
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={5}
                    placeholder="Напишете отговор..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
                    Откажи
                  </Button>
                  <Button className="btn-primary" onClick={submitReply} disabled={replyContact.isPending || replyMessage.trim().length < 3}>
                    {replyContact.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Изпрати"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
