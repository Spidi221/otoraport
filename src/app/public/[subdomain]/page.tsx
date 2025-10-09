import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BrandedLayout } from '@/components/branding/branded-layout';
import { Card } from '@/components/ui/card';
import { Metadata } from 'next';

interface PublicPropertyPageProps {
  params: {
    subdomain: string;
  };
}

// Revalidate every 5 minutes (property data may change frequently)
export const revalidate = 300;

// Generate metadata for SEO
export async function generateMetadata({ params }: PublicPropertyPageProps): Promise<Metadata> {
  const supabase = await createClient();

  const { data: developer } = await supabase
    .from('developers')
    .select('company_name, subdomain')
    .eq('subdomain', params.subdomain)
    .single();

  if (!developer) {
    return {
      title: 'Nie znaleziono',
    };
  }

  return {
    title: `${developer.company_name} - Oferta mieszkań`,
    description: `Sprawdź aktualną ofertę mieszkań od ${developer.company_name}. Aktualne ceny, szczegóły i kontakt.`,
    openGraph: {
      title: `${developer.company_name} - Oferta mieszkań`,
      description: `Sprawdź aktualną ofertę mieszkań od ${developer.company_name}`,
      type: 'website',
    },
  };
}

export default async function PublicPropertyPage({ params }: PublicPropertyPageProps) {
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

  // Fetch active properties for this developer
  const { data: properties, error: propsError } = await supabase
    .from('properties')
    .select('*')
    .eq('developer_id', developer.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (propsError) {
    console.error('Error fetching properties:', propsError);
  }

  const activeProperties = properties || [];

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
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Aktualna oferta mieszkań</h1>
          <p className="text-lg text-muted-foreground">
            {activeProperties.length} {activeProperties.length === 1 ? 'mieszkanie' : 'mieszkań'} dostępnych
          </p>
        </div>

        {/* Properties Grid */}
        {activeProperties.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              Brak dostępnych mieszkań w ofercie. Zapraszamy wkrótce!
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeProperties.map((property) => (
              <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">
                    Mieszkanie {property.apartment_number}
                  </h3>

                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    {property.area && (
                      <p>Powierzchnia: <strong>{property.area} m²</strong></p>
                    )}
                    {property.rooms && (
                      <p>Pokoje: <strong>{property.rooms}</strong></p>
                    )}
                    {property.floor !== null && (
                      <p>Piętro: <strong>{property.floor}</strong></p>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-2xl font-bold text-primary">
                      {property.final_price.toLocaleString('pl-PL')} zł
                    </p>
                    {property.price_per_m2 && (
                      <p className="text-sm text-muted-foreground">
                        {property.price_per_m2.toLocaleString('pl-PL')} zł/m²
                      </p>
                    )}
                  </div>

                  {property.miejscowosc && (
                    <div className="mt-4 text-sm text-muted-foreground">
                      <p>
                        {property.ulica && `${property.ulica}, `}
                        {property.miejscowosc}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-12 text-center">
          <Card className="p-8 bg-muted">
            <h2 className="text-2xl font-semibold mb-4">Zainteresowany?</h2>
            <p className="text-muted-foreground mb-6">
              Skontaktuj się z nami, aby uzyskać więcej informacji
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {developer.email && (
                <a
                  href={`mailto:${developer.email}`}
                  className="text-primary hover:underline font-medium"
                >
                  {developer.email}
                </a>
              )}
              {developer.phone && (
                <a
                  href={`tel:${developer.phone}`}
                  className="text-primary hover:underline font-medium"
                >
                  {developer.phone}
                </a>
              )}
            </div>
            {developer.website && (
              <div className="mt-4">
                <a
                  href={developer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Odwiedź naszą stronę →
                </a>
              </div>
            )}
          </Card>
        </div>
      </div>
    </BrandedLayout>
  );
}
