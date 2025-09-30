'use client';

import { Bell, Settings, User, Shield } from "lucide-react";
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
import { OtoraportLogo } from "../icons/otoraport-logo";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

interface HeaderProps {
  showUserMenu?: boolean;
}

// Header for public pages (without session)
export function PublicHeader() {
  return (
    <header className="border-b bg-white px-4 py-4 lg:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <OtoraportLogo />
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Link href="/auth/signin">
              <Button variant="ghost">Zaloguj się</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Dołącz za darmo</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

// Header for authenticated pages (with session)
function AuthenticatedHeader() {
  const { user, developer, signOut, isAdmin } = useAuth();

  return (
    <header className="border-b bg-white px-4 py-4 lg:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <OtoraportLogo />
        
        <div className="flex items-center gap-4">
          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
                >
                  2
                </Badge>
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
                  {developer?.company_name || developer?.name || 'Ładowanie...'}
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
      </div>
    </header>
  );
}

export function Header({ showUserMenu = true }: HeaderProps) {
  if (!showUserMenu) {
    return <PublicHeader />;
  }
  
  return <AuthenticatedHeader />;
}