import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { 
  GraduationCap, 
  Users, 
  Star, 
  Clock, 
  MapPin, 
  Calendar as CalendarIcon,
  MessageCircle, 
  Video, 
  Phone,
  BookOpen,
  Award,
  Search,
  Filter,
  Plus,
  Send,
  FileText,
  Globe,
  Heart,
  CheckCircle,
  AlertCircle,
  Zap,
  Target,
  TrendingUp,
  Shield,
  Crown,
  Coffee
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MentorProfile {
  id: number;
  userId: string;
  name: string;
  avatar?: string;
  isActive: boolean;
  expertiseAreas: string[];
  languages: string[];
  countries: string[];
  yearsExperience: number;
  totalTrips: number;
  mentorRating: number;
  totalMentees: number;
  bio: string;
  hourlyRate?: number;
  responseTime: number;
  verificationStatus: string;
  badges: string[];
  isOnline: boolean;
}

interface MentorshipRequest {
  id: number;
  menteeId: string;
  mentorId: string;
  mentorName: string;
  mentorAvatar?: string;
  status: string;
  requestType: string;
  topic: string;
  description: string;
  urgency: string;
  preferredContactMethod: string;
  budget?: number;
  sessionDate?: string;
  duration?: number;
  location: string;
  experience: string;
  createdAt: string;
  updatedAt: string;
}

interface MentorshipSession {
  id: number;
  requestId: number;
  mentorId: string;
  menteeId: string;
  mentorName: string;
  menteeName: string;
  sessionType: string;
  status: string;
  startTime: string;
  endTime?: string;
  actualDuration?: number;
  notes?: string;
  rating?: number;
  createdAt: string;
}

interface MentorshipProgram {
  id: number;
  mentorId: string;
  mentorName: string;
  mentorAvatar?: string;
  title: string;
  description: string;
  programType: string;
  duration: number;
  maxParticipants: number;
  currentParticipants: number;
  price?: number;
  rating: number;
  totalGraduates: number;
  startDate?: string;
  isActive: boolean;
}

export default function MentoringSystem() {
  const [activeTab, setActiveTab] = useState("find-mentor");
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showBecomeDialog, setShowBecomeDialog] = useState(false);
  const [filterExpertise, setFilterExpertise] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();

  // Fetch mentors
  const { data: mentors, isLoading: mentorsLoading } = useQuery<MentorProfile[]>({
    queryKey: ["/api/mentors"],
  });

  // Fetch user's mentorship requests
  const { data: requests } = useQuery<MentorshipRequest[]>({
    queryKey: ["/api/mentorship/requests"],
  });

  // Fetch user's sessions
  const { data: sessions } = useQuery<MentorshipSession[]>({
    queryKey: ["/api/mentorship/sessions"],
  });

  // Fetch mentorship programs
  const { data: programs } = useQuery<MentorshipProgram[]>({
    queryKey: ["/api/mentorship/programs"],
  });

  // Create mentorship request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (requestData: any) => {
      return await apiRequest("/api/mentorship/requests", "POST", requestData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentorship/requests"] });
      setShowRequestDialog(false);
      toast({
        title: "Demande envoyée",
        description: "Votre demande de mentorat a été envoyée avec succès.",
      });
    },
  });

  // Become mentor mutation
  const becomeMentorMutation = useMutation({
    mutationFn: async (profileData: any) => {
      return await apiRequest("/api/mentors/apply", "POST", profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentors"] });
      setShowBecomeDialog(false);
      toast({
        title: "Candidature envoyée",
        description: "Votre candidature pour devenir mentor a été soumise.",
      });
    },
  });

  const handleRequestMentorship = (formData: FormData) => {
    if (!selectedMentor) return;
    
    const requestData = {
      mentorId: selectedMentor.userId,
      requestType: formData.get("requestType"),
      topic: formData.get("topic"),
      description: formData.get("description"),
      urgency: formData.get("urgency"),
      preferredContactMethod: formData.get("contactMethod"),
      duration: parseInt(formData.get("duration") as string) || 60,
      location: formData.get("location"),
      experience: formData.get("experience"),
      sessionDate: selectedDate?.toISOString(),
      budget: formData.get("budget") ? parseFloat(formData.get("budget") as string) : undefined,
    };
    
    createRequestMutation.mutate(requestData);
  };

  const handleBecomeMentor = (formData: FormData) => {
    const profileData = {
      expertiseAreas: (formData.get("expertiseAreas") as string)?.split(",").map(area => area.trim()) || [],
      languages: (formData.get("languages") as string)?.split(",").map(lang => lang.trim()) || [],
      countries: (formData.get("countries") as string)?.split(",").map(country => country.trim()) || [],
      yearsExperience: parseInt(formData.get("yearsExperience") as string) || 0,
      totalTrips: parseInt(formData.get("totalTrips") as string) || 0,
      bio: formData.get("bio"),
      hourlyRate: formData.get("hourlyRate") ? parseFloat(formData.get("hourlyRate") as string) : undefined,
    };
    
    becomeMentorMutation.mutate(profileData);
  };

  const getExpertiseBadgeColor = (area: string) => {
    const colors: { [key: string]: string } = {
      adventure: "bg-red-100 text-red-800",
      culture: "bg-purple-100 text-purple-800",
      budget: "bg-green-100 text-green-800",
      luxury: "bg-yellow-100 text-yellow-800",
      family: "bg-blue-100 text-blue-800",
      solo: "bg-gray-100 text-gray-800",
      photography: "bg-pink-100 text-pink-800",
    };
    return colors[area.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-green-100 text-green-800";
      case "declined": return "bg-red-100 text-red-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case "verified": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "premium": return <Crown className="w-4 h-4 text-yellow-500" />;
      default: return null;
    }
  };

  const filteredMentors = mentors?.filter(mentor => {
    const matchesExpertise = filterExpertise === "all" || 
      mentor.expertiseAreas.some(area => area.toLowerCase().includes(filterExpertise.toLowerCase()));
    const matchesSearch = !searchQuery || 
      mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.countries.some(country => country.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesExpertise && matchesSearch;
  });

  if (mentorsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-blue-600" />
            Système de Mentorat
          </h1>
          <p className="text-gray-600 mt-1">
            Connectez-vous avec des voyageurs expérimentés ou partagez votre expertise
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={showBecomeDialog} onOpenChange={setShowBecomeDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Devenir mentor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Devenir mentor de voyage</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleBecomeMentor(formData);
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expertiseAreas">Domaines d'expertise *</Label>
                    <Input
                      id="expertiseAreas"
                      name="expertiseAreas"
                      placeholder="aventure, culture, budget, photographie"
                      required
                    />
                    <p className="text-xs text-gray-500">Séparez par des virgules</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="languages">Langues parlées *</Label>
                    <Input
                      id="languages"
                      name="languages"
                      placeholder="français, anglais, espagnol"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="countries">Pays visités *</Label>
                    <Input
                      id="countries"
                      name="countries"
                      placeholder="France, Japon, Thaïlande"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearsExperience">Années d'expérience *</Label>
                    <Input
                      id="yearsExperience"
                      name="yearsExperience"
                      type="number"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalTrips">Nombre de voyages</Label>
                    <Input
                      id="totalTrips"
                      name="totalTrips"
                      type="number"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">Tarif horaire (€)</Label>
                    <Input
                      id="hourlyRate"
                      name="hourlyRate"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Optionnel pour mentorat gratuit"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Présentation *</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder="Présentez-vous et décrivez votre expérience de voyage..."
                    rows={4}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={becomeMentorMutation.isPending}>
                  {becomeMentorMutation.isPending ? "Envoi en cours..." : "Soumettre ma candidature"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="find-mentor">Trouver un mentor</TabsTrigger>
          <TabsTrigger value="my-requests">Mes demandes</TabsTrigger>
          <TabsTrigger value="my-sessions">Mes sessions</TabsTrigger>
          <TabsTrigger value="programs">Programmes</TabsTrigger>
          <TabsTrigger value="resources">Ressources</TabsTrigger>
        </TabsList>

        <TabsContent value="find-mentor" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Rechercher un mentor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={filterExpertise} onValueChange={setFilterExpertise}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les expertises</SelectItem>
                  <SelectItem value="adventure">Aventure</SelectItem>
                  <SelectItem value="culture">Culture</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="luxury">Luxe</SelectItem>
                  <SelectItem value="family">Famille</SelectItem>
                  <SelectItem value="solo">Solo</SelectItem>
                  <SelectItem value="photography">Photographie</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mentors Grid */}
          {filteredMentors && filteredMentors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMentors.map((mentor) => (
                <Card key={mentor.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={mentor.avatar} />
                            <AvatarFallback>
                              {mentor.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {mentor.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{mentor.name}</h3>
                            {getVerificationIcon(mentor.verificationStatus)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Star className="w-4 h-4 fill-current text-yellow-500" />
                            <span>{mentor.mentorRating.toFixed(1)}</span>
                            <span>•</span>
                            <span>{mentor.totalMentees} mentorés</span>
                          </div>
                        </div>
                      </div>
                      {mentor.hourlyRate && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {mentor.hourlyRate}€/h
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-700 line-clamp-3">{mentor.bio}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Globe className="w-4 h-4" />
                        <span>{mentor.countries.slice(0, 3).join(", ")}</span>
                        {mentor.countries.length > 3 && (
                          <span className="text-gray-500">+{mentor.countries.length - 3}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Répond en {mentor.responseTime}h en moyenne</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {mentor.expertiseAreas.slice(0, 3).map((area, index) => (
                        <Badge key={index} variant="secondary" className={`text-xs ${getExpertiseBadgeColor(area)}`}>
                          {area}
                        </Badge>
                      ))}
                      {mentor.expertiseAreas.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{mentor.expertiseAreas.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        className="flex-1" 
                        onClick={() => {
                          setSelectedMentor(mentor);
                          setShowRequestDialog(true);
                        }}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Contacter
                      </Button>
                      <Button variant="outline" size="sm">
                        <BookOpen className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun mentor trouvé
              </h3>
              <p className="text-gray-600">
                Aucun mentor ne correspond à vos critères de recherche.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-requests" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Mes demandes de mentorat</h2>
          </div>
          
          {requests && requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src={request.mentorAvatar} />
                          <AvatarFallback>
                            {request.mentorName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{request.mentorName}</h3>
                            <Badge className={getStatusBadgeColor(request.status)}>
                              {request.status}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-gray-900">{request.topic}</h4>
                          <p className="text-sm text-gray-600">{request.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Type: {request.requestType}</span>
                            <span>•</span>
                            <span>Urgence: {request.urgency}</span>
                            <span>•</span>
                            <span>Destination: {request.location}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>{new Date(request.createdAt).toLocaleDateString('fr-FR')}</div>
                        {request.sessionDate && (
                          <div className="mt-1">
                            Session: {new Date(request.sessionDate).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucune demande
              </h3>
              <p className="text-gray-600">
                Vous n'avez pas encore fait de demande de mentorat.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-sessions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Mes sessions de mentorat</h2>
          </div>
          
          {sessions && sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.map((session) => (
                <Card key={session.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">
                            Session avec {session.mentorName || session.menteeName}
                          </h3>
                          <Badge className={getStatusBadgeColor(session.status)}>
                            {session.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            <span>{new Date(session.startTime).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(session.startTime).toLocaleTimeString('fr-FR')}</span>
                          </div>
                          {session.actualDuration && (
                            <span>Durée: {session.actualDuration}min</span>
                          )}
                        </div>
                        {session.notes && (
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                            {session.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {session.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-current text-yellow-500" />
                            <span className="text-sm">{session.rating}</span>
                          </div>
                        )}
                        {session.sessionType === "video" && (
                          <Video className="w-4 h-4 text-blue-500" />
                        )}
                        {session.sessionType === "chat" && (
                          <MessageCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucune session
              </h3>
              <p className="text-gray-600">
                Vous n'avez pas encore participé à des sessions de mentorat.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="programs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Programmes de mentorat</h2>
          </div>
          
          {programs && programs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {programs.map((program) => (
                <Card key={program.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{program.title}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          par {program.mentorName}
                        </p>
                      </div>
                      {program.price && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {program.price}€
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-700">{program.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>{program.duration} semaines</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>{program.currentParticipants}/{program.maxParticipants}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{program.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-blue-500" />
                        <span>{program.totalGraduates} diplômés</span>
                      </div>
                    </div>

                    <Badge variant="secondary" className="w-fit">
                      {program.programType}
                    </Badge>

                    <div className="flex items-center gap-2">
                      <Button className="flex-1">
                        S'inscrire
                      </Button>
                      <Button variant="outline" size="sm">
                        <BookOpen className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun programme disponible
              </h3>
              <p className="text-gray-600">
                Il n'y a actuellement aucun programme de mentorat actif.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Ressources de voyage</h2>
          </div>
          
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ressources bientôt disponibles
            </h3>
            <p className="text-gray-600">
              Les guides, listes et templates seront ajoutés prochainement.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Request Mentorship Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Demander un mentorat avec {selectedMentor?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleRequestMentorship(formData);
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requestType">Type de demande *</Label>
                <Select name="requestType" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advice">Conseil ponctuel</SelectItem>
                    <SelectItem value="planning">Aide à la planification</SelectItem>
                    <SelectItem value="emergency">Urgence voyage</SelectItem>
                    <SelectItem value="long-term">Mentorat long terme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="urgency">Urgence *</Label>
                <Select name="urgency" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez l'urgence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="normal">Normale</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Sujet *</Label>
              <Input
                id="topic"
                name="topic"
                placeholder="Ex: Préparation voyage au Japon"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description détaillée *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Décrivez votre situation et ce que vous recherchez..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Destination</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Ex: Tokyo, Japon"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Votre niveau</Label>
                <Select name="experience">
                  <SelectTrigger>
                    <SelectValue placeholder="Votre expérience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Débutant</SelectItem>
                    <SelectItem value="intermediate">Intermédiaire</SelectItem>
                    <SelectItem value="advanced">Avancé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactMethod">Méthode de contact préférée</Label>
                <Select name="contactMethod">
                  <SelectTrigger>
                    <SelectValue placeholder="Comment vous contacter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chat">Chat écrit</SelectItem>
                    <SelectItem value="video">Appel vidéo</SelectItem>
                    <SelectItem value="phone">Téléphone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Durée souhaitée (minutes)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min="15"
                  max="120"
                  step="15"
                  defaultValue="60"
                />
              </div>
            </div>

            {selectedMentor?.hourlyRate && (
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (€)</Label>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={`Tarif: ${selectedMentor.hourlyRate}€/h`}
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={createRequestMutation.isPending}>
              {createRequestMutation.isPending ? "Envoi en cours..." : "Envoyer la demande"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}