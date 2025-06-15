import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, DollarSign, Users, TrendingUp, ExternalLink, Share2, Gift, Calendar, Euro } from 'lucide-react';
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
  const [customLink, setCustomLink] = useState('');
  const { toast } = useToast();

  const { data: affiliateData, isLoading } = useQuery<AffiliateData>({
    queryKey: ['/api/affiliate/dashboard'],
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié!",
      description: `${label} copié dans le presse-papiers`,
    });
  };

  const generateReferralLink = (path: string = '') => {
    const baseUrl = window.location.origin;
    return `${baseUrl}${path}?ref=${affiliateData?.referralCode}`;
  };

  const shareOptions = [
    {
      name: 'Page d\'accueil',
      path: '/',
      description: 'Lien vers la page principale de Wanderlust'
    },
    {
      name: 'Plans d\'abonnement',
      path: '/subscription',
      description: 'Dirigez vers les plans premium'
    },
    {
      name: 'Marketplace',
      path: '/marketplace',
      description: 'Découvrez notre marketplace de contenu'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!affiliateData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Rejoignez le Programme d'Affiliation</CardTitle>
              <CardDescription>
                Gagnez des commissions en recommandant Wanderlust à vos amis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">20%</div>
                  <p className="text-sm text-gray-600">Commission récurrente</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">30j</div>
                  <p className="text-sm text-gray-600">Durée de cookie</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">0€</div>
                  <p className="text-sm text-gray-600">Seuil de paiement</p>
                </div>
              </div>
              
              <div className="text-center">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                  S'inscrire au Programme
                </Button>
                <p className="text-sm text-gray-600 mt-2">
                  Inscription gratuite • Validation sous 24h
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Programme d'Affiliation
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Gagnez des revenus en recommandant Wanderlust. 
            20% de commission sur tous les abonnements premium de vos filleuls.
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px] mx-auto mb-8">
            <TabsTrigger value="dashboard">Tableau de Bord</TabsTrigger>
            <TabsTrigger value="links">Liens</TabsTrigger>
            <TabsTrigger value="referrals">Filleuls</TabsTrigger>
            <TabsTrigger value="payouts">Paiements</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Overview Stats */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Gains Totaux</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {affiliateData.totalEarnings.toFixed(2)}€
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-2xl">
                      <Euro className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">En Attente</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {affiliateData.pendingEarnings.toFixed(2)}€
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-2xl">
                      <Calendar className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Filleuls</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {affiliateData.totalReferrals}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-2xl">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Taux Conversion</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {((affiliateData.activeReferrals / affiliateData.totalReferrals) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-2xl">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Mensuelle</CardTitle>
                <CardDescription>
                  Comparaison entre ce mois et le mois dernier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Ce Mois</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nouveaux filleuls</span>
                        <span className="font-medium">{affiliateData.stats.thisMonth.referrals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Conversions</span>
                        <span className="font-medium">{affiliateData.stats.thisMonth.conversions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gains</span>
                        <span className="font-medium text-green-600">
                          {affiliateData.stats.thisMonth.earnings.toFixed(2)}€
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-600">Mois Dernier</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nouveaux filleuls</span>
                        <span className="font-medium text-gray-600">{affiliateData.stats.lastMonth.referrals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Conversions</span>
                        <span className="font-medium text-gray-600">{affiliateData.stats.lastMonth.conversions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gains</span>
                        <span className="font-medium text-gray-600">
                          {affiliateData.stats.lastMonth.earnings.toFixed(2)}€
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informations du Compte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">ID Affilié</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value={affiliateData.affiliateId} readOnly className="bg-gray-50" />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(affiliateData.affiliateId, 'ID affilié')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Code de Parrainage</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value={affiliateData.referralCode} readOnly className="bg-gray-50" />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(affiliateData.referralCode, 'Code de parrainage')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                    Statut: {affiliateData.status}
                  </Badge>
                  <Badge variant="outline">
                    Commission: {affiliateData.commissionRate}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="links" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Générateur de Liens</CardTitle>
                <CardDescription>
                  Créez des liens personnalisés pour maximiser vos conversions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick Links */}
                <div>
                  <h3 className="font-medium mb-4">Liens Rapides</h3>
                  <div className="space-y-4">
                    {shareOptions.map((option, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{option.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                            <div className="bg-gray-50 p-2 rounded text-sm font-mono text-gray-800 break-all">
                              {generateReferralLink(option.path)}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => copyToClipboard(generateReferralLink(option.path), option.name)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Link Generator */}
                <div>
                  <h3 className="font-medium mb-4">Lien Personnalisé</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="custom-link">Chemin personnalisé (optionnel)</Label>
                      <Input
                        id="custom-link"
                        placeholder="/page-specifique"
                        value={customLink}
                        onChange={(e) => setCustomLink(e.target.value)}
                      />
                    </div>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <p className="text-sm text-gray-600 mb-2">Lien généré:</p>
                      <div className="font-mono text-sm break-all">
                        {generateReferralLink(customLink)}
                      </div>
                    </div>
                    <Button 
                      onClick={() => copyToClipboard(generateReferralLink(customLink), 'Lien personnalisé')}
                      className="w-full"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copier le Lien
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Filleuls Récents</CardTitle>
                <CardDescription>
                  Suivez l'activité de vos derniers filleuls
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {affiliateData.recentReferrals.map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                          {referral.referredUser.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{referral.referredUser}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(referral.date).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={referral.status === 'converted' ? 'default' : 'secondary'}
                          className={referral.status === 'converted' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {referral.status === 'converted' ? 'Converti' : 'En attente'}
                        </Badge>
                        {referral.commission > 0 && (
                          <p className="text-sm font-medium text-green-600 mt-1">
                            +{referral.commission.toFixed(2)}€
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Paiements</CardTitle>
                <CardDescription>
                  Gérez vos méthodes de paiement et consultez l'historique
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-900">Gains en Attente</h3>
                      <p className="text-blue-700 text-sm mt-1">
                        Vous avez {affiliateData.pendingEarnings.toFixed(2)}€ en attente de paiement.
                        Les paiements sont effectués chaque vendredi.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Historique des Paiements</h3>
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Aucun paiement pour le moment</p>
                    <p className="text-sm mt-1">
                      Vos premiers gains apparaîtront ici après validation
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}