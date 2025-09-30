'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'
import { InAppHelpSystem, HelpResource, HelpContext } from '@/lib/help-system'
import {
  Search,
  BookOpen,
  Video,
  HelpCircle,
  Clock,
  ThumbsUp,
  ArrowLeft,
  Zap,
  MessageCircle
} from 'lucide-react'
import Link from 'next/link'

export default function HelpPage() {
  const { user, developer } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [helpResources, setHelpResources] = useState<HelpResource[]>([])
  const [filteredResources, setFilteredResources] = useState<HelpResource[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  const context: HelpContext = {
    page: 'help',
    section: 'knowledge_base',
    user_action: 'browsing',
    subscription_plan: developer?.subscription_plan || 'basic',
    onboarding_step: developer?.onboarding_step || 0,
    feature_flags: []
  }

  useEffect(() => {
    async function loadHelpResources() {
      setLoading(true)
      try {
        const resources = await InAppHelpSystem.getContextualHelp(context)
        setHelpResources(resources)
        setFilteredResources(resources)
      } catch (error) {
        console.error('Error loading help resources:', error)
      } finally {
        setLoading(false)
      }
    }

    loadHelpResources()
  }, [])

  useEffect(() => {
    // Filter resources based on search query and category
    let filtered = helpResources

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(resource => resource.category === selectedCategory)
    }

    if (searchQuery) {
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    setFilteredResources(filtered)
  }, [searchQuery, selectedCategory, helpResources])

  const categories = [
    { id: 'all', label: 'Wszystkie', icon: BookOpen },
    { id: 'data_upload', label: 'Przesyłanie danych', icon: Zap },
    { id: 'ministry_reporting', label: 'Raportowanie', icon: HelpCircle },
    { id: 'billing', label: 'Płatności', icon: Clock },
    { id: 'analytics', label: 'Analityka', icon: Video },
    { id: 'troubleshooting', label: 'Problemy', icon: MessageCircle },
  ]

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />
      case 'interactive':
        return <Zap className="w-4 h-4" />
      case 'faq':
        return <MessageCircle className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleResourceClick = async (resource: HelpResource) => {
    // Track resource usage
    if (user?.id) {
      await InAppHelpSystem.trackResourceUsage(resource.id, user.id, 'view')
    }
    // In production, this would open the resource detail page
    console.log('Opening resource:', resource)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Zaloguj się</CardTitle>
            <CardDescription>Musisz być zalogowany, aby uzyskać dostęp do centrum pomocy</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/signin">
              <Button className="w-full">Przejdź do logowania</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót do Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-2">Centrum Pomocy</h1>
          <p className="text-gray-600">Znajdź odpowiedzi na swoje pytania i naucz się korzystać z OTORAPORT</p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Szukaj w centrum pomocy..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Szybki start</CardTitle>
                  <CardDescription className="text-xs">Przewodnik dla nowych użytkowników</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Video className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Video tutorial</CardTitle>
                  <CardDescription className="text-xs">Obejrzyj jak to działa</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Kontakt z wsparciem</CardTitle>
                  <CardDescription className="text-xs">Porozmawiaj z ekspertem</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Categories */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
            {categories.map(category => {
              const Icon = category.icon
              return (
                <TabsTrigger key={category.id} value={category.id} className="text-xs md:text-sm">
                  <Icon className="w-4 h-4 mr-1" />
                  {category.label}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>

        {/* Help Resources */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredResources.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nie znaleziono wyników</h3>
              <p className="text-gray-600">Spróbuj użyć innych słów kluczowych lub skontaktuj się z naszym wsparciem</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredResources.map(resource => (
              <Card
                key={resource.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleResourceClick(resource)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getResourceIcon(resource.type)}
                      <Badge variant="outline" className={getDifficultyColor(resource.difficulty)}>
                        {resource.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {resource.estimated_read_time} min
                    </div>
                  </div>
                  <CardTitle className="text-lg">{resource.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{resource.content}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {resource.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      {resource.helpful_votes}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Contact Support Section */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-green-50">
          <CardHeader>
            <CardTitle>Nie znalazłeś odpowiedzi?</CardTitle>
            <CardDescription>Nasz zespół wsparcia jest gotowy Ci pomóc</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <Button className="flex-1" variant="outline">
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat na żywo
              </Button>
              <Button className="flex-1" variant="outline">
                <HelpCircle className="w-4 h-4 mr-2" />
                Zgłoś problem
              </Button>
              <Link href="mailto:support@otoraport.pl" className="flex-1">
                <Button className="w-full">
                  Email: support@otoraport.pl
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
