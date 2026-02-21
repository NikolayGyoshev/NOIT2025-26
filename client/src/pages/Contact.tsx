import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useCreateContactMessage, useContactMessagesByEmail } from "@/hooks/use-contact";
import { useAuth } from "@/hooks/use-auth";

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createMessage = useCreateContactMessage();
  const [lookupEmail, setLookupEmail] = useState("");
  const { data: myMessages } = useContactMessagesByEmail(lookupEmail.trim());
  const { user } = useAuth();

  useEffect(() => {
    if (user?.email && !lookupEmail) {
      setLookupEmail(user.email);
    }
  }, [user?.email, lookupEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const submittedEmail = String(formData.get("email") || "");
      await createMessage.mutateAsync({
        name: String(formData.get("name") || ""),
        email: submittedEmail,
        subject: String(formData.get("subject") || ""),
        message: String(formData.get("message") || ""),
      });
      setLookupEmail(submittedEmail);
      toast({
        title: "Съобщението е изпратено!",
        description: "Благодарим ви, ще се свържем с вас скоро.",
      });
      form.reset();
    } catch (error) {
      toast({
        title: "Грешка",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/10">
      <div className="bg-primary py-16 text-center text-white">
        <h1 className="text-4xl font-display font-bold mb-4">Свържете се с нас</h1>
        <p className="max-w-2xl mx-auto opacity-90">
          Имате въпроси? Нашите консултанти са на разположение 24/7.
        </p>
      </div>

      <div className="container-custom -mt-10 mb-20">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* Info Side */}
          <div className="bg-secondary/30 p-10 space-y-8">
            <h3 className="text-2xl font-bold font-display text-primary">Информация за контакти</h3>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <MapPin className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold">Адрес</h4>
                  <p className="text-muted-foreground">Пазарджик, България</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Phone className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold">Телефон</h4>
                  <p className="text-muted-foreground">+359 895 759 357</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Mail className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold">Имейл</h4>
                  <p className="text-muted-foreground">noshtuvkiplus@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Clock className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h4 className="font-semibold">Работно време</h4>
                  <p className="text-muted-foreground">Понеделник - Неделя<br/>24 часа</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="p-10">
            <h3 className="text-2xl font-bold font-display text-primary mb-6">Изпратете съобщение</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Име</Label>
                  <Input id="name" name="name" placeholder="Иван Петров" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Имейл</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="ivan@example.com"
                    defaultValue={user?.email || ""}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Тема</Label>
                <Input id="subject" name="subject" placeholder="Въпрос относно резервация" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Съобщение</Label>
                <Textarea id="message" name="message" placeholder="Напишете вашето съобщение тук..." rows={5} required />
              </div>

              <Button type="submit" className="w-full btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Изпращане..." : "Изпрати"}
              </Button>
            </form>

            <div className="mt-10 pt-8 border-t">
              <h4 className="text-lg font-semibold mb-4">Проверете отговор</h4>
              <div className="space-y-3">
                <Label htmlFor="lookupEmail">Вашият имейл</Label>
                <Input
                  id="lookupEmail"
                  type="email"
                  placeholder="ivan@example.com"
                  value={lookupEmail}
                  onChange={(e) => setLookupEmail(e.target.value)}
                />
                <div className="space-y-3">
                  {lookupEmail.trim() ? (
                    myMessages?.length ? (
                    myMessages.map((msg) => (
                      <div key={msg.id} className="border rounded-lg p-4 bg-muted/10">
                        <div className="text-sm text-muted-foreground">
                          <div><span className="font-medium">Тема:</span> {msg.subject}</div>
                          <div><span className="font-medium">Изпратено:</span> {new Date(msg.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="mt-3">
                          <div className="font-medium">Вашето съобщение</div>
                          <div className="text-sm text-muted-foreground mt-1">{msg.message}</div>
                        </div>
                        <div className="mt-3">
                          <div className="font-medium">Отговор от администратор</div>
                          {msg.replyMessage ? (
                            <div className="text-sm mt-1">
                              {msg.replyMessage}
                              {msg.repliedAt && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Отговорено на {new Date(msg.repliedAt).toLocaleString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground mt-1">Все още няма отговор.</div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Няма намерени съобщения за този имейл.</p>
                  )
                  ) : (
                    <p className="text-sm text-muted-foreground">Въведете имейл, за да видите отговорите.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
