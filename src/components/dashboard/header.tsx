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
  const { useSession } = require("next-auth/react");
  const { data: session } = useSession();
  
  // Admin emails
  const ADMIN_EMAILS = [
    'admin@otoraport.pl',
    'bartlomiej@agencjaai.pl'
  ];
  
  const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

  return (
    <header className="border-b bg-white px-4 py-4 lg:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <OtoraportLogo />
        
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge 
              variant="destructive" 
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              2
            </Badge>
          </Button>

          {/* Admin Panel */}
          {isAdmin && (
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <Shield className="h-5 w-5" />
              </Button>
            </Link>
          )}

          {/* Settings */}
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm leading-none">
                  {session?.user?.name || 'Użytkownik'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session?.user?.email || 'email@example.com'}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Ustawienia</span>
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
              <DropdownMenuItem>
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