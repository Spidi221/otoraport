'use client';

import { Bell, Settings, User, Shield, Menu, X } from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { OtoRaportLogo } from "../icons/oto-raport-logo";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth-simple";
import { useNotifications } from "@/hooks/use-notifications";
import { useState } from "react";

interface HeaderProps {
  showUserMenu?: boolean;
}

// Header for public pages (without session)
export function PublicHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="border-b bg-white/95 backdrop-blur-lg shadow-sm px-4 py-4 lg:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <OtoRaportLogo />

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Link href="/auth/signin">
              <Button variant="ghost" className="text-gray-700 hover:text-blue-600">Zaloguj się</Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold shadow-md">Dołącz za darmo</Button>
            </Link>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div className="fixed right-0 top-0 h-full w-80 max-w-full bg-white shadow-xl transition-transform duration-300">
            <div className="flex items-center justify-between border-b px-4 py-4">
              <span className="text-lg font-semibold">Menu</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex flex-col gap-2 p-4">
              <Link href="/auth/signin" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  Zaloguj się
                </Button>
              </Link>
              <Link href="/auth/signup" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full">
                  Dołącz za darmo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// Header for authenticated pages (with session)
function AuthenticatedHeader() {
  const { user, developer, signOut, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    setIsMobileMenuOpen(false);
    signOut();
  };

  return (
    <header className="border-b bg-white/95 backdrop-blur-lg shadow-sm px-4 py-4 lg:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <OtoRaportLogo />

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
              <div className="flex items-center justify-between p-3 border-b">
                <h3 className="font-semibold">Powiadomienia</h3>
                <Link href="/dashboard/notifications" className="text-sm text-blue-600 hover:underline">
                  Zobacz wszystkie
                </Link>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <DropdownMenuItem className="p-3 cursor-pointer" asChild>
                  <Link href="/dashboard/notifications?id=1">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-sm">Nowe mieszkania dodane</p>
                        <p className="text-xs text-gray-500">Pomyślnie dodano 15 mieszkań z pliku CSV</p>
                        <p className="text-xs text-gray-400 mt-1">2 godz. temu</p>
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-3 cursor-pointer" asChild>
                  <Link href="/dashboard/notifications?id=2">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-sm">Raport XML wygenerowany</p>
                        <p className="text-xs text-gray-500">Twój raport ministerialny jest gotowy</p>
                        <p className="text-xs text-gray-400 mt-1">5 godz. temu</p>
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Admin Panel */}
          {isAdmin && (
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <Shield className="h-5 w-5" />
              </Button>
            </Link>
          )}

          {/* Settings Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <User className="mr-2 h-4 w-4" />
                  Profil użytkownika
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/domains">
                  <Settings className="mr-2 h-4 w-4" />
                  Domeny niestandardowe
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/notifications">
                  <Bell className="mr-2 h-4 w-4" />
                  Powiadomienia
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {developer?.company_name ? developer.company_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm leading-none">
                  {developer?.company_name || 'Ładowanie...'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || developer?.email || 'Ładowanie...'}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Ustawienia</span>
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Shield className="mr-2 h-4 w-4 text-red-600" />
                      <span className="text-red-600">Panel Administracyjny</span>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 hover:bg-red-50 cursor-pointer"
                onClick={() => signOut()}
              >
                Wyloguj się
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div className="fixed right-0 top-0 h-full w-80 max-w-full bg-white shadow-xl transition-transform duration-300 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {developer?.company_name ? developer.company_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-medium">
                    {developer?.company_name || 'Użytkownik'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email || developer?.email || ''}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation Items */}
            <div className="flex flex-col">
              {/* Main Navigation */}
              <div className="border-b p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase text-gray-500">Nawigacja</h3>
                <div className="flex flex-col gap-2">
                  <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <User className="mr-3 h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/dashboard/settings" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <User className="mr-3 h-4 w-4" />
                      Profil użytkownika
                    </Button>
                  </Link>
                  <Link href="/settings/domains" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <Settings className="mr-3 h-4 w-4" />
                      Domeny niestandardowe
                    </Button>
                  </Link>
                  <Link href="/dashboard/notifications" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start relative">
                      <Bell className="mr-3 h-4 w-4" />
                      Powiadomienia
                      {unreadCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="ml-auto h-5 min-w-[20px] rounded-full px-1 text-xs"
                        >
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Admin Section (if admin) */}
              {isAdmin && (
                <div className="border-b p-4">
                  <h3 className="mb-3 text-xs font-semibold uppercase text-gray-500">Administracja</h3>
                  <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Shield className="mr-3 h-4 w-4" />
                      Panel Administracyjny
                    </Button>
                  </Link>
                </div>
              )}

              {/* Account Section */}
              <div className="p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase text-gray-500">Konto</h3>
                <div className="flex flex-col gap-2">
                  <Link href="/dashboard/settings" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <Settings className="mr-3 h-4 w-4" />
                      Ustawienia
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleSignOut}
                  >
                    <X className="mr-3 h-4 w-4" />
                    Wyloguj się
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function Header({ showUserMenu = true }: HeaderProps) {
  if (!showUserMenu) {
    return <PublicHeader />;
  }
  
  return <AuthenticatedHeader />;
}