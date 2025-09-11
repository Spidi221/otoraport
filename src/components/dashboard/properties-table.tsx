import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const mockProperties = [
  {
    id: "1",
    number: "A1/12",
    type: "Mieszkanie",
    area: 48.5,
    pricePerM2: 12500,
    totalPrice: 606250,
    status: "available",
    project: "Osiedle Słoneczne"
  },
  {
    id: "2", 
    number: "B2/5",
    type: "Mieszkanie",
    area: 65.2,
    pricePerM2: 11800,
    totalPrice: 769360,
    status: "reserved",
    project: "Osiedle Słoneczne"
  },
  {
    id: "3",
    number: "C1/8",
    type: "Dom",
    area: 120.0,
    pricePerM2: 9500,
    totalPrice: 1140000,
    status: "sold",
    project: "Villa Park"
  },
  {
    id: "4",
    number: "A2/15",
    type: "Mieszkanie",
    area: 42.8,
    pricePerM2: 13200,
    totalPrice: 564960,
    status: "available",
    project: "Osiedle Słoneczne"
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'available':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Dostępne</Badge>;
    case 'reserved':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Zarezerwowane</Badge>;
    case 'sold':
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Sprzedane</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export function PropertiesTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nieruchomości</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium text-sm">Nr lokalu</th>
                <th className="pb-3 font-medium text-sm">Typ</th>
                <th className="pb-3 font-medium text-sm">Projekt</th>
                <th className="pb-3 font-medium text-sm">Powierzchnia</th>
                <th className="pb-3 font-medium text-sm">Cena/m²</th>
                <th className="pb-3 font-medium text-sm">Cena całkowita</th>
                <th className="pb-3 font-medium text-sm">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockProperties.map((property) => (
                <tr key={property.id} className="border-b last:border-b-0">
                  <td className="py-3 font-mono text-sm">{property.number}</td>
                  <td className="py-3 text-sm">{property.type}</td>
                  <td className="py-3 text-sm text-muted-foreground">{property.project}</td>
                  <td className="py-3 text-sm">{property.area}m²</td>
                  <td className="py-3 text-sm">{property.pricePerM2.toLocaleString('pl-PL')} zł</td>
                  <td className="py-3 text-sm font-medium">{property.totalPrice.toLocaleString('pl-PL')} zł</td>
                  <td className="py-3">{getStatusBadge(property.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            Pokazano 4 z 248 nieruchomości
          </div>
          <div className="text-sm text-muted-foreground">
            Paginacja (do zaimplementowania)
          </div>
        </div>
      </CardContent>
    </Card>
  );
}