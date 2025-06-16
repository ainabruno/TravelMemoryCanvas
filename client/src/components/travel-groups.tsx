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
import { 
  Users, 
  Plus, 
  Settings, 
  MessageCircle, 
  Calendar,
  MapPin,
  Euro,
  CheckSquare,
  UserPlus,
  Crown,
  Shield,
  Eye,
  Lock,
  Globe,
  Copy,
  Send,
  MoreHorizontal,
  Filter,
  Search,
  Plane,
  Camera,
  Clock,
  Target,
  TrendingUp,
  Star,
  Heart
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TravelGroup {
  id: number;
  name: string;
  description?: string;
  coverImageUrl?: string;
  ownerId: string;
  isPrivate: boolean;
  joinCode?: string;
  maxMembers: number;
  tags: string[];
  location?: string;
  budget?: string;
  travelStyle?: string;
  memberCount: number;
  tripCount: number;
  createdAt: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
}

interface GroupMember {
  id: number;
  userId: string;
  role: string;
  nickname?: string;
  avatar?: string;
  joinedAt: string;
  isOnline: boolean;
}

interface GroupMessage {
  id: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  messageType: string;
  createdAt: string;
  isEdited: boolean;
}

interface GroupTask {
  id: number;
  title: string;
  description?: string;
  assignedTo?: string;
  assignedToName?: string;
  status: string;
  priority: string;
  dueDate?: string;
  category?: string;
  createdBy: string;
  createdAt: string;
}

export default function TravelGroups() {
  const [selectedGroup, setSelectedGroup] = useState<TravelGroup | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Fetch user's travel groups
  const { data: groups, isLoading } = useQuery<TravelGroup[]>({
    queryKey: ["/api/travel-groups"],
  });

  // Fetch group details when a group is selected
  const { data: groupDetails } = useQuery({
    queryKey: ["/api/travel-groups", selectedGroup?.id],
    enabled: !!selectedGroup,
  });

  // Fetch group members
  const { data: members } = useQuery<GroupMember[]>({
    queryKey: ["/api/travel-groups", selectedGroup?.id, "members"],
    enabled: !!selectedGroup,
  });

  // Fetch group messages
  const { data: messages } = useQuery<GroupMessage[]>({
    queryKey: ["/api/travel-groups", selectedGroup?.id, "messages"],
    enabled: !!selectedGroup,
  });

  // Fetch group tasks
  const { data: tasks } = useQuery<GroupTask[]>({
    queryKey: ["/api/travel-groups", selectedGroup?.id, "tasks"],
    enabled: !!selectedGroup,
  });

  // Create new group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: any) => {
      return await apiRequest("/api/travel-groups", "POST", groupData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/travel-groups"] });
      setShowCreateDialog(false);
      toast({
        title: "Groupe créé",
        description: "Votre groupe de voyage a été créé avec succès.",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      return await apiRequest(`/api/travel-groups/${selectedGroup?.id}/messages`, "POST", messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/travel-groups", selectedGroup?.id, "messages"] 
      });
      setNewMessage("");
    },
  });

  // Join group mutation
  const joinGroupMutation = useMutation({
    mutationFn: async (joinCode: string) => {
      return await apiRequest("/api/travel-groups/join", "POST", { joinCode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/travel-groups"] });
      setShowJoinDialog(false);
      toast({
        title: "Groupe rejoint",
        description: "Vous avez rejoint le groupe avec succès.",
      });
    },
  });

  const handleCreateGroup = (formData: FormData) => {
    const groupData = {
      name: formData.get("name"),
      description: formData.get("description"),
      location: formData.get("location"),
      budget: formData.get("budget"),
      travelStyle: formData.get("travelStyle"),
      isPrivate: formData.get("isPrivate") === "on",
      maxMembers: parseInt(formData.get("maxMembers") as string) || 20,
      tags: (formData.get("tags") as string)?.split(",").map(tag => tag.trim()) || [],
    };
    createGroupMutation.mutate(groupData);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    sendMessageMutation.mutate({
      content: newMessage,
      messageType: "text",
    });
  };

  const handleJoinGroup = (formData: FormData) => {
    const joinCode = formData.get("joinCode") as string;
    if (joinCode) {
      joinGroupMutation.mutate(joinCode);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin': return <Shield className="w-4 h-4 text-blue-500" />;
      case 'member': return <Users className="w-4 h-4 text-green-500" />;
      default: return <Eye className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'member': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const filteredGroups = groups?.filter(group => {
    const matchesRole = filterRole === "all" || group.role === filterRole;
    const matchesSearch = !searchQuery || 
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  if (isLoading) {
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
            <Users className="w-8 h-8 text-blue-600" />
            Groupes de Voyage
          </h1>
          <p className="text-gray-600 mt-1">
            Organisez et planifiez vos voyages en groupe
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="w-4 h-4 mr-2" />
                Rejoindre un groupe
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rejoindre un groupe</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleJoinGroup(formData);
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="joinCode">Code d'invitation</Label>
                  <Input
                    id="joinCode"
                    name="joinCode"
                    placeholder="Entrez le code d'invitation"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Rejoindre le groupe
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Créer un groupe
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un nouveau groupe</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateGroup(formData);
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du groupe *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Mon groupe de voyage"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Destination</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="Tokyo, Japon"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Décrivez votre groupe et vos objectifs de voyage..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget</Label>
                    <Select name="budget">
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un budget" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="economique">Économique (&lt; 1000€)</SelectItem>
                        <SelectItem value="moyen">Moyen (1000-3000€)</SelectItem>
                        <SelectItem value="confortable">Confortable (3000-5000€)</SelectItem>
                        <SelectItem value="luxe">Luxe (&gt; 5000€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="travelStyle">Style de voyage</Label>
                    <Select name="travelStyle">
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aventure">Aventure</SelectItem>
                        <SelectItem value="culturel">Culturel</SelectItem>
                        <SelectItem value="detente">Détente</SelectItem>
                        <SelectItem value="gastronomie">Gastronomie</SelectItem>
                        <SelectItem value="nature">Nature</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxMembers">Nombre max de membres</Label>
                    <Input
                      id="maxMembers"
                      name="maxMembers"
                      type="number"
                      min="2"
                      max="50"
                      defaultValue="20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
                    <Input
                      id="tags"
                      name="tags"
                      placeholder="aventure, montagne, photographie"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="isPrivate" name="isPrivate" />
                  <Label htmlFor="isPrivate" className="text-sm">
                    Groupe privé (accessible uniquement par invitation)
                  </Label>
                </div>

                <Button type="submit" className="w-full">
                  Créer le groupe
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              <SelectItem value="owner">Propriétaire</SelectItem>
              <SelectItem value="admin">Administrateur</SelectItem>
              <SelectItem value="member">Membre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-500" />
          <Input
            placeholder="Rechercher un groupe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {selectedGroup ? (
        // Group Detail View
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => setSelectedGroup(null)}
            >
              ← Retour aux groupes
            </Button>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{selectedGroup.name}</h2>
              <p className="text-gray-600">{selectedGroup.description}</p>
            </div>
            <Badge className={getRoleBadgeColor(selectedGroup.role)}>
              {getRoleIcon(selectedGroup.role)}
              <span className="ml-1 capitalize">{selectedGroup.role}</span>
            </Badge>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Aperçu</TabsTrigger>
              <TabsTrigger value="members">
                Membres ({members?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="tasks">Tâches</TabsTrigger>
              <TabsTrigger value="planning">Planning</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Users className="w-6 h-6 text-blue-600" />
                      <h3 className="font-semibold">Membres actifs</h3>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      {members?.filter(m => m.isOnline).length || 0}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      sur {members?.length || 0} membres
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Plane className="w-6 h-6 text-green-600" />
                      <h3 className="font-semibold">Voyages planifiés</h3>
                    </div>
                    <div className="text-3xl font-bold text-green-600">
                      {selectedGroup.tripCount}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      voyages en cours
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckSquare className="w-6 h-6 text-purple-600" />
                      <h3 className="font-semibold">Tâches complétées</h3>
                    </div>
                    <div className="text-3xl font-bold text-purple-600">
                      {tasks?.filter(t => t.status === 'completed').length || 0}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      sur {tasks?.length || 0} tâches
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Activité récente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {messages?.slice(0, 5).map((message) => (
                      <div key={message.id} className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={message.userAvatar} />
                          <AvatarFallback>
                            {message.userName ? message.userName.slice(0, 2).toUpperCase() : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{message.userName}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(message.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{message.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="members" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members?.map((member) => (
                  <Card key={member.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>
                              {member.nickname?.slice(0, 2).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          {member.isOnline && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{member.nickname || 'Membre'}</span>
                            {getRoleIcon(member.role)}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={getRoleBadgeColor(member.role)}>
                              {member.role}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {member.isOnline ? 'En ligne' : 'Hors ligne'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="chat" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Chat du groupe</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96 w-full pr-4">
                    <div className="space-y-4">
                      {messages?.map((message) => (
                        <div key={message.id} className="flex items-start gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={message.userAvatar} />
                            <AvatarFallback>
                              {message.userName ? message.userName.slice(0, 2).toUpperCase() : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{message.userName}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(message.createdAt).toLocaleTimeString('fr-FR')}
                              </span>
                              {message.isEdited && (
                                <Badge variant="outline" className="text-xs">Modifié</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 mt-1">{message.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <Separator className="my-4" />
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Tapez votre message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Tâches du groupe</h3>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle tâche
                </Button>
              </div>
              
              <div className="space-y-3">
                {tasks?.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={task.status === 'completed'}
                              className="data-[state=checked]:bg-green-600"
                            />
                            <div>
                              <h4 className="font-medium">{task.title}</h4>
                              {task.description && (
                                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2">
                                <Badge 
                                  variant="outline" 
                                  className={getTaskPriorityColor(task.priority)}
                                >
                                  {task.priority}
                                </Badge>
                                {task.assignedToName && (
                                  <span className="text-xs text-gray-500">
                                    Assigné à {task.assignedToName}
                                  </span>
                                )}
                                {task.dueDate && (
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="planning" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Planning du groupe</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Planning collaboratif
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Organisez les événements et activités de votre groupe
                    </p>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter un événement
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        // Groups Grid View
        <div className="space-y-6">
          {filteredGroups && filteredGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group) => (
                <Card 
                  key={group.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedGroup(group)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">{group.name}</CardTitle>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                          {group.description || "Aucune description"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {group.isPrivate ? (
                          <Lock className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Globe className="w-4 h-4 text-green-500" />
                        )}
                        <Badge className={getRoleBadgeColor(group.role)}>
                          {getRoleIcon(group.role)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{group.memberCount}/{group.maxMembers}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Plane className="w-4 h-4" />
                        <span>{group.tripCount} voyage(s)</span>
                      </div>
                    </div>

                    {group.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{group.location}</span>
                      </div>
                    )}

                    {group.tags && group.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {group.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {group.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{group.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Créé le {new Date(group.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                      {group.budget && (
                        <Badge variant="outline" className="text-xs">
                          {group.budget}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun groupe trouvé
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || filterRole !== "all" 
                  ? "Aucun groupe ne correspond à vos critères de recherche."
                  : "Vous n'avez pas encore de groupes de voyage. Créez-en un pour commencer !"
                }
              </p>
              {(!searchQuery && filterRole === "all") && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer votre premier groupe
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}