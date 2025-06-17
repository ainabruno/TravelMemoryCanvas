import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PageLayout from "@/components/page-layout";
import { MapPin, Calendar as CalendarIcon, Save, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function NewTripPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tripData, setTripData] = useState({
    title: "",
    description: "",
    location: "",
    startDate: new Date(),
    endDate: null as Date | null,
  });

  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  const createTripMutation = useMutation({
    mutationFn: async (data: typeof tripData) => {
      const response = await apiRequest('POST', '/api/trips', {
        title: data.title,
        description: data.description,
        location: data.location,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate?.toISOString() || null,
      });
      return response.json();
    },
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      toast({
        title: "Voyage créé",
        description: `Le voyage "${trip.title}" a été créé avec succès`,
      });
      setLocation('/');
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le voyage",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tripData.title.trim() || !tripData.location.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir le titre et la destination",
        variant: "destructive",
      });
      return;
    }

    if (tripData.endDate && tripData.endDate < tripData.startDate) {
      toast({
        title: "Dates invalides",
        description: "La date de fin doit être après la date de début",
        variant: "destructive",
      });
      return;
    }

    createTripMutation.mutate(tripData);
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Nouveau Voyage</h1>
            <p className="text-gray-600">Créez un nouveau voyage pour organiser vos souvenirs</p>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Informations du voyage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Titre du voyage *</Label>
                  <Input
                    id="title"
                    value={tripData.title}
                    onChange={(e) => setTripData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Découverte du Japon"
                    className="w-full"
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Destination *</Label>
                  <Input
                    id="location"
                    value={tripData.location}
                    onChange={(e) => setTripData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Ex: Tokyo, Japon"
                    className="w-full"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={tripData.description}
                    onChange={(e) => setTripData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Décrivez votre voyage..."
                    rows={4}
                    className="w-full"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Start Date */}
                  <div className="space-y-2">
                    <Label>Date de début *</Label>
                    <Popover open={showStartCalendar} onOpenChange={setShowStartCalendar}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(tripData.startDate, "dd MMMM yyyy", { locale: fr })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={tripData.startDate}
                          onSelect={(date) => {
                            if (date) {
                              setTripData(prev => ({ ...prev, startDate: date }));
                              setShowStartCalendar(false);
                            }
                          }}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* End Date */}
                  <div className="space-y-2">
                    <Label>Date de fin</Label>
                    <Popover open={showEndCalendar} onOpenChange={setShowEndCalendar}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {tripData.endDate 
                            ? format(tripData.endDate, "dd MMMM yyyy", { locale: fr })
                            : "Sélectionner une date"
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={tripData.endDate || undefined}
                          onSelect={(date) => {
                            setTripData(prev => ({ ...prev, endDate: date || null }));
                            setShowEndCalendar(false);
                          }}
                          disabled={(date) => date < tripData.startDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={createTripMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {createTripMutation.isPending ? (
                      "Création..."
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Créer le voyage
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}