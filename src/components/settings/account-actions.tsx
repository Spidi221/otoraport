'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { KeyRound, Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function AccountActions() {
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const router = useRouter()

  const handleChangePassword = async () => {
    setIsChangingPassword(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user?.email) {
        toast.error('Nie znaleziono adresu email użytkownika')
        return
      }

      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        toast.error('Nie udało się wysłać emaila z linkiem resetującym')
      } else {
        toast.success('Wysłano email z linkiem do zmiany hasła')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Wystąpił błąd podczas zmiany hasła')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true)

    try {
      const supabase = createClient()

      // Delete user account (will cascade delete developer profile and properties via RLS)
      const { error } = await supabase.auth.admin.deleteUser(
        (await supabase.auth.getUser()).data.user?.id || ''
      )

      if (error) {
        // Fallback: sign out user if admin delete fails
        await supabase.auth.signOut()
        toast.success('Konto zostało wylogowane. Skontaktuj się z obsługą w celu usunięcia konta.')
        router.push('/auth/signin')
      } else {
        toast.success('Konto zostało usunięte')
        router.push('/auth/signin')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Wystąpił błąd podczas usuwania konta')
    } finally {
      setIsDeletingAccount(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Działania na koncie</CardTitle>
        <CardDescription>
          Zmień hasło lub usuń konto (akcja nieodwracalna)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Change Password */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <KeyRound className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Zmień hasło</p>
              <p className="text-sm text-muted-foreground">
                Wyślemy Ci email z linkiem do zmiany hasła
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleChangePassword}
            disabled={isChangingPassword}
          >
            {isChangingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Zmień hasło
          </Button>
        </div>

        {/* Delete Account */}
        <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900 rounded-lg bg-red-50 dark:bg-red-950">
          <div className="flex items-center gap-3">
            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-100">Usuń konto</p>
              <p className="text-sm text-red-700 dark:text-red-300">
                Trwale usuń konto i wszystkie dane. Akcja nieodwracalna.
              </p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeletingAccount}>
                {isDeletingAccount && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Usuń konto
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Czy na pewno chcesz usunąć konto?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ta akcja jest nieodwracalna. Wszystkie Twoje dane, w tym mieszkania,
                  raporty i konfiguracja API zostaną trwale usunięte.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Usuń konto
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <p className="text-xs text-muted-foreground pt-2">
          Potrzebujesz pomocy? Skontaktuj się z nami pod adresem support@oto-raport.pl
        </p>
      </CardContent>
    </Card>
  )
}
