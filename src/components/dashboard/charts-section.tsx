'use client'

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

export function ChartsSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Price Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trend cen za m²</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="text-6xl mb-2">📈</div>
              <p>Wykres trendu cen</p>
              <p className="text-sm">(będzie zaimplementowany)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rozkład nieruchomości</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="type" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="type">Typ</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
            </TabsList>
            <TabsContent value="type" className="space-y-4">
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <div className="text-6xl mb-2">🏠</div>
                  <p>Wykres typu nieruchomości</p>
                  <p className="text-sm">(będzie zaimplementowany)</p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="status" className="space-y-4">
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <div className="text-6xl mb-2">📊</div>
                  <p>Wykres statusu nieruchomości</p>
                  <p className="text-sm">(będzie zaimplementowany)</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}