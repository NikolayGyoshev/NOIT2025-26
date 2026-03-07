import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, Menu, User, Hotel } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Navbar() {
  const [location] = useLocation();
  const { user, isLoading, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const links = [
    { href: "/", label: "Начало" },
    { href: "/rooms", label: "Стаи" },
    { href: "/contact", label: "Контакти" },
  ];

  // Helper to check if link is active
  const isActive = (path: string) => location === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-custom flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Hotel className="h-6 w-6 text-primary" />
          <span className="font-display text-xl font-bold tracking-tight text-primary">
            Нощувки<span className="text-accent">+</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive(link.href) ? "text-primary font-bold" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full border border-border">
                  {user.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt={user.firstName || "User"} className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user.firstName && <p className="font-medium">{user.firstName} {user.lastName}</p>}
                    <p className="w-[200px] truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/my-reservations">Моите резервации</Link>
                </DropdownMenuItem>
                {user?.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Администрация</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Изход
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/login">Вход</Link>
              </Button>
              <Button asChild size="sm" className="btn-primary">
                <Link href="/register">Регистрирай се</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col space-y-6 mt-8">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-lg font-medium transition-colors hover:text-primary ${
                      isActive(link.href) ? "text-primary font-bold" : "text-muted-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                
                <div className="border-t pt-4">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : user ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                         {user.profileImageUrl ? (
                          <img src={user.profileImageUrl} alt="User" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                            <User className="h-4 w-4 text-secondary-foreground" />
                          </div>
                        )}
                        <span className="font-medium">{user.firstName || user.email}</span>
                      </div>
                      <Link href="/my-reservations" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium hover:text-primary">
                        Моите резервации
                      </Link>
                      {user?.isAdmin && (
                        <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium hover:text-primary">
                          Администрация
                        </Link>
                      )}
                      <Button variant="outline" className="w-full justify-start text-destructive" onClick={() => logout()}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Изход
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>Вход</Link>
                      </Button>
                      <Button asChild className="w-full btn-primary">
                        <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>Регистрирай се</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
