'use client';

import { useState } from 'react';
import { Mail, Phone, MessageCircle, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'technical',
    priority: 'normal',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setFormData({
          name: '',
          email: '',
          subject: 'technical',
          priority: 'normal',
          message: '',
        });
      }
    } catch (error) {
      console.error('Failed to submit form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isSubmitted) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Dziękujemy za kontakt!
          </h3>
          <p className="text-gray-600 mb-6">
            Otrzymaliśmy Twoją wiadomość i odpowiemy najszybciej jak to możliwe.
            Spodziewaj się odpowiedzi w ciągu 24 godzin (dni robocze).
          </p>
          <Button onClick={() => setIsSubmitted(false)} variant="outline">
            Wyślij kolejną wiadomość
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Contact Info */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Email</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href="mailto:support@oto-raport.pl"
              className="flex items-center space-x-3 text-blue-600 hover:text-blue-700"
            >
              <Mail className="w-5 h-5" />
              <span>support@oto-raport.pl</span>
            </a>
            <p className="text-sm text-gray-500 mt-2">
              Odpowiadamy w ciągu 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Telefon</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href="tel:+48XXXXXXXXX"
              className="flex items-center space-x-3 text-blue-600 hover:text-blue-700"
            >
              <Phone className="w-5 h-5" />
              <span>+48 XXX XXX XXX</span>
            </a>
            <p className="text-sm text-gray-500 mt-2">
              Pon-Pt, 9:00-17:00
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Live Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <MessageCircle className="w-5 h-5 mr-2" />
              Rozpocznij czat
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              Dostępny dla Pro i Enterprise
            </p>
          </CardContent>
        </Card>

        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Godziny pracy</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Poniedziałek - Piątek:</span>
              <span className="font-medium">9:00 - 17:00</span>
            </div>
            <div className="flex justify-between">
              <span>Sobota - Niedziela:</span>
              <span className="font-medium">Zamknięte</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Wyślij wiadomość</CardTitle>
          <CardDescription>
            Wypełnij formularz, a odpowiemy najszybciej jak to możliwe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Imię i nazwisko *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Jan Kowalski"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="jan@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Temat *</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) => handleChange('subject', value)}
                >
                  <SelectTrigger id="subject">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Problem techniczny</SelectItem>
                    <SelectItem value="billing">Płatności i subskrypcja</SelectItem>
                    <SelectItem value="general">Pytanie ogólne</SelectItem>
                    <SelectItem value="feature">Nowa funkcja</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priorytet</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleChange('priority', value)}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Niski</SelectItem>
                    <SelectItem value="normal">Normalny</SelectItem>
                    <SelectItem value="high">Wysoki</SelectItem>
                    <SelectItem value="urgent">Pilny</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Wiadomość *</Label>
              <textarea
                id="message"
                required
                value={formData.message}
                onChange={(e) => handleChange('message', e.target.value)}
                placeholder="Opisz szczegółowo swój problem lub pytanie..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500">
                Im więcej szczegółów podasz, tym szybciej będziemy mogli pomóc
              </p>
            </div>

            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-gray-500">
                * Pola wymagane
              </p>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Wysyłanie...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Wyślij wiadomość
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
