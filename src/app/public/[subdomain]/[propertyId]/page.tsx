import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BrandedLayout } from '@/components/branding/branded-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Home, Ruler, Bed, Building2 } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

interface PropertyDetailPageProps {
  params: {
    subdomain: string;
    propertyId: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PropertyDetailPageProps): Promise<Metadata> {
  const supabase = await createClient();

  const { data: developer } = await supabase
    .from('developers')
    .select('company_name, id')
    .eq('subdomain', params.subdomain)
    .single();

  if (!developer) {
    return { title: 'Nie znaleziono' };
  }

  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', params.propertyId)
    .eq('developer_id', developer.id)
    .single();

  if (!property) {
    return { title: 'Nie znaleziono' };
  }

  return {
    title: `Mieszkanie ${property.apartment_number} - ${developer.company_name}`,
    description: `${property.area ? `${property.area}m², ` : ''}${property.rooms ? `${property.rooms} pokoje, ` : ''}${property.final_price.toLocaleString('pl-PL')} zł`,
    openGraph: {
      title: `Mieszkanie ${property.apartment_number} - ${developer.company_name}`,
      description: `${property.area ? `${property.area}m², ` : ''}${property.final_price.toLocaleString('pl-PL')} zł`,
      type: 'website',
    },
  };
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const supabase = await createClient();

  // Fetch developer by subdomain
  const { data: developer, error: devError } = await supabase
    .from('developers')
    .select('id, company_name, subdomain, branding_logo_url, branding_primary_color, branding_secondary_color, email, phone, website')
    .eq('subdomain', params.subdomain)
    .single();

  if (devError || !developer) {
    console.error('Developer not found:', params.subdomain, devError);
    notFound();
  }

  // Fetch property by ID (verify it belongs to this developer)
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('*')
    .eq('id', params.propertyId)
    .eq('developer_id', developer.id)
    .single();

  if (propError || !property) {
    console.error('Property not found:', params.propertyId, propError);
    notFound();
  }

  return (
    <BrandedLayout
      companyName={developer.company_name}
      logoUrl={developer.branding_logo_url}
      primaryColor={developer.branding_primary_color}
      secondaryColor={developer.branding_secondary_color}
      contactInfo={{
        email: developer.email,
        phone: developer.phone,
        website: developer.website,
      }}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href={`/public/${params.subdomain}`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót do listy
          </Button>
        </Link>

        {/* Property Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Mieszkanie {property.apartment_number}
          </h1>
          {property.miejscowosc && (
            <p className="text-lg text-muted-foreground flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {property.ulica && `${property.ulica}, `}
              {property.miejscowosc}, {property.kod_pocztowy}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Features */}
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Podstawowe informacje</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {property.area && (
                  <div className="flex items-center gap-2">
                    <Ruler className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Powierzchnia</p>
                      <p className="font-semibold">{property.area} m²</p>
                    </div>
                  </div>
                )}
                {property.rooms && (
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Pokoje</p>
                      <p className="font-semibold">{property.rooms}</p>
                    </div>
                  </div>
                )}
                {property.floor !== null && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Piętro</p>
                      <p className="font-semibold">{property.floor}</p>
                    </div>
                  </div>
                )}
                {property.property_type && (
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Typ</p>
                      <p className="font-semibold">{property.property_type}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Location Details */}
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Lokalizacja</h2>
              <div className="space-y-2">
                <p><strong>Województwo:</strong> {property.wojewodztwo}</p>
                <p><strong>Powiat:</strong> {property.powiat}</p>
                <p><strong>Gmina:</strong> {property.gmina}</p>
                {property.ulica && (
                  <p><strong>Ulica:</strong> {property.ulica} {property.nr_budynku}</p>
                )}
              </div>
            </Card>

            {/* Additional Services */}
            {(property.parking_price || property.storage_price || property.necessary_rights_price || property.other_services_price) && (
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Dodatkowe usługi</h2>
                <div className="space-y-3">
                  {property.parking_price && (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Miejsce parkingowe</p>
                        {property.parking_designation && (
                          <p className="text-sm text-muted-foreground">{property.parking_designation}</p>
                        )}
                      </div>
                      <p className="font-semibold">{property.parking_price.toLocaleString('pl-PL')} zł</p>
                    </div>
                  )}
                  {property.storage_price && (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Komórka lokatorska</p>
                        {property.storage_designation && (
                          <p className="text-sm text-muted-foreground">{property.storage_designation}</p>
                        )}
                      </div>
                      <p className="font-semibold">{property.storage_price.toLocaleString('pl-PL')} zł</p>
                    </div>
                  )}
                  {property.necessary_rights_price && (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Prawa niezbędne</p>
                        {property.necessary_rights_description && (
                          <p className="text-sm text-muted-foreground">{property.necessary_rights_description}</p>
                        )}
                      </div>
                      <p className="font-semibold">{property.necessary_rights_price.toLocaleString('pl-PL')} zł</p>
                    </div>
                  )}
                  {property.other_services_price && (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Inne usługi</p>
                        {property.other_services_type && (
                          <p className="text-sm text-muted-foreground">{property.other_services_type}</p>
                        )}
                      </div>
                      <p className="font-semibold">{property.other_services_price.toLocaleString('pl-PL')} zł</p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Price Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h2 className="text-2xl font-semibold mb-4">Cena</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Cena końcowa</p>
                  <p className="text-3xl font-bold text-primary">
                    {property.final_price.toLocaleString('pl-PL')} zł
                  </p>
                  {property.price_per_m2 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {property.price_per_m2.toLocaleString('pl-PL')} zł/m²
                    </p>
                  )}
                </div>

                {property.base_price !== property.final_price && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Cena bazowa</p>
                    <p className="text-lg font-semibold">
                      {property.base_price.toLocaleString('pl-PL')} zł
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2">
                    Cena aktualna od: {new Date(property.price_valid_from).toLocaleDateString('pl-PL')}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {developer.email && (
                  <Button asChild className="w-full">
                    <a href={`mailto:${developer.email}?subject=Zapytanie o mieszkanie ${property.apartment_number}`}>
                      Wyślij zapytanie
                    </a>
                  </Button>
                )}
                {developer.phone && (
                  <Button asChild variant="outline" className="w-full">
                    <a href={`tel:${developer.phone}`}>
                      Zadzwoń
                    </a>
                  </Button>
                )}
              </div>

              {property.prospectus_url && (
                <div className="mt-4">
                  <Button asChild variant="link" className="w-full">
                    <a href={property.prospectus_url} target="_blank" rel="noopener noreferrer">
                      Pobierz prospekt →
                    </a>
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </BrandedLayout>
  );
}
