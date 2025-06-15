import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Copy, DollarSign, Users, TrendingUp, Share, Link, Calendar, Euro, CheckCircle, Clock, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AffiliateData {
  affiliateId: string;
  status: string;
  commissionRate: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  referralCode: string;
  totalReferrals: number;
  activeReferrals: number;
  stats: {
    thisMonth: {
      referrals: number;
      earnings: number;
      conversions: number;
    };
    lastMonth: {
      referrals: number;
      earnings: number;
      conversions: number;
    };
  };
  recentReferrals: Array<{
    id: number;
    referredUser: string;
    status: string;
    commission: number;
    date: string;
  }>;
}

export default function Affiliate() {
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const { toast } = useToast();

  const { data: affiliateData, isLoading } = useQuery<AffiliateData>({
    queryKey: ['/api/affiliate/data'],
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié !",
      description: `${label} copié dans le presse-papiers`,
    });
  };

  const getReferralLink = () => {
    return `https://wanderlust.app/register?ref=${affiliateData?.referralCode}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'paid':
        return <Badge className="bg-blue-100 text-blue-800">Payé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!affiliateData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-3">
                  <DollarSign className="w-8 h-8 text-amber-600" />
                  Rejoignez notre Programme d'Affiliation
                </CardTitle>
                <CardDescription>
                  Gagnez 20% de commission sur chaque utilisateur que vous parrainez
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <DollarSign className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                    <h3 className="font-semibold">20% Commission</h3>
                    <p className="text-sm text-gray-600">Sur tous les abonnements premium</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold">Suivi en temps réel</h3>
                    <p className="text-sm text-gray-600">Suivez vos parrainages et gains</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-semibold">Paiements mensuels</h3>
                    <p className="text-sm text-gray-600">Recevez vos commissions chaque mois</p>
                  </div>
                </div>
                <Button className="w-full bg-amber-600 hover:bg-amber-700">
                  Rejoindre le programme
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-amber-100 rounded-2xl">
              <DollarSign className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Programme d'Affiliation</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Gagnez 20% de commission en recommandant Wanderlust à vos amis et votre audience
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-96 mx-auto mb-8">
            <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
            <TabsTrigger value="links">Liens</TabsTrigger>
            <TabsTrigger value="referrals">Parrainages</TabsTrigger>
            <TabsTrigger value="payments">Paiements</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Gains totaux</p>
                      <p className="text-3xl font-bold text-gray-900">{affiliateData.totalEarnings}€</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <Euro className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-green-600">
                    +{calculateGrowth(affiliateData.stats.thisMonth.earnings, affiliateData.stats.lastMonth.earnings)}% ce mois
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Gains en attente</p>
                      <p className="text-3xl font-bold text-gray-900">{affiliateData.pendingEarnings}€</p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Paiement le 1er du mois
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total parrainages</p>
                      <p className="text-3xl font-bold text-gray-900">{affiliateData.totalReferrals}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-green-600">
                    +{calculateGrowth(affiliateData.stats.thisMonth.referrals, affiliateData.stats.lastMonth.referrals)}% ce mois
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Taux de conversion</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {affiliateData.totalReferrals > 0 
                          ? Math.round((affiliateData.stats.thisMonth.conversions / affiliateData.stats.thisMonth.referrals) * 100)
                          : 0}%
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {affiliateData.stats.thisMonth.conversions} conversions ce mois
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Informations du compte */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations du compte</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID Affilié:</span>
                    <span className="font-mono">{affiliateData.affiliateId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Statut:</span>
                    {getStatusBadge(affiliateData.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taux de commission:</span>
                    <span className="font-semibold">{affiliateData.commissionRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Parrainages actifs:</span>
                    <span className="font-semibold">{affiliateData.activeReferrals}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Progression ce mois</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Objectif mensuel</span>
                      <span>{affiliateData.stats.thisMonth.earnings}€ / 500€</span>
                    </div>
                    <Progress 
                      value={(affiliateData.stats.thisMonth.earnings / 500) * 100} 
                      className="w-full"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-600">{affiliateData.stats.thisMonth.referrals}</p>
                      <p className="text-sm text-gray-600">Nouveaux parrainages</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{affiliateData.stats.thisMonth.earnings}€</p>
                      <p className="text-sm text-gray-600">Gains ce mois</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="links" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Vos liens de parrainage</CardTitle>
                  <CardDescription>
                    Partagez ces liens pour gagner des commissions sur les nouveaux utilisateurs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Code de parrainage
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={affiliateData.referralCode}
                        readOnly
                        className="font-mono"
                      />
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(affiliateData.referralCode, "Code de parrainage")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Lien de parrainage
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={getReferralLink()}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(getReferralLink(), "Lien de parrainage")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                    <Button className="flex items-center gap-2">
                      <Share className="w-4 h-4" />
                      Partager sur les réseaux
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Link className="w-4 h-4" />
                      Créer un lien personnalisé
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="referrals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Parrainages récents</CardTitle>
                <CardDescription>
                  Suivez l'activité de vos parrainages et leur statut
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {affiliateData.recentReferrals.map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                          {referral.referredUser.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{referral.referredUser}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(referral.date).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">{referral.commission}€</p>
                          <p className="text-sm text-gray-600">Commission</p>
                        </div>
                        {getStatusBadge(referral.status)}
                      </div>
                    </div>
                  ))}
                  
                  {affiliateData.recentReferrals.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Aucun parrainage pour le moment
                      </h3>
                      <p className="text-gray-600">
                        Commencez à partager votre lien pour voir vos premiers parrainages
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Prochains paiements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-medium">Paiement en attente</p>
                        <p className="text-sm text-gray-600">1er du mois prochain</p>
                      </div>
                    </div>
                    <p className="font-bold text-yellow-600">{affiliateData.pendingEarnings}€</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Historique des paiements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium">Décembre 2024</p>
                          <p className="text-sm text-gray-600">Payé le 1er janvier</p>
                        </div>
                      </div>
                      <p className="font-semibold text-green-600">+{affiliateData.paidEarnings}€</p>
                    </div>
                    
                    {affiliateData.paidEarnings === 0 && (
                      <div className="text-center py-6">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Aucun paiement encore effectué</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}