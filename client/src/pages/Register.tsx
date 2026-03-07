import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate inputs
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
        toast({
          title: "Попълнете всички полета",
          description: "Моля, попълнете всички полета.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        toast({
          title: "Слаба парола",
          description: "Паролата трябва да е поне 6 символа.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Паролите не съвпадат",
          description: "Паролата и потвърждението не съвпадат.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          isAdmin: false,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      // Invalidate the user query to force a refetch with the new session
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      toast({
        title: "Регистрация успешна!",
        description: "Добре дошли! Преведено сте в начало.",
      });

      // Redirect to home after successful registration
      setTimeout(() => {
        setLocation("/");
      }, 500);
    } catch (error) {
      toast({
        title: "Грешка при регистрацията",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display mb-2">Регистрация</h1>
          <p className="text-muted-foreground">Създайте нов акаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Име</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Иван"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Фамилия</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Иванов"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Имейл</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="ivan@example.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="password">Парола</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Потвърди парола</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••"
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Регистриране...
              </>
            ) : (
              "Регистрирай се"
            )}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Вече имаш акаунт?
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setLocation("/login")}
          >
            Влез в профила
          </Button>
        </div>
      </Card>
    </div>
  );
}
