import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageLayout from '@/components/page-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Crown, Star, Zap, Shield, Users, Sparkles, Gift, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlan {
  id: number;
  name: string;
  displayName: string;
  description: string;
  price: number;
  yearlyPrice: number;
  currency: string;
  features: string[];
  limits: {
    trips: number;
    photosPerMonth: number;
    storageGB: number;
    aiRequests: number;
    videoGeneration: number;
  };
  isRecommended?: boolean;
}

interface CurrentSubscription {
  id: number;
  planId: number;
  planName: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  usage: {
    storageUsed: number;
    photosUploaded: number;
    aiRequestsUsed: number;
    videoGenerations: number;
    sharedAlbums: number;
  };
  limits: {
    trips: number;
    photosPerMonth: number;
    storageGB: number;
    aiRequests: number;
    videoGeneration: number;
  };
}

export default function Subscription() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const { toast } = useToast();

  const { data: plans = [], isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription/plans'],
  });

  const { data: currentSub, isLoading: subLoading } = useQuery<CurrentSubscription>({
    queryKey: ['/api/subscription/current'],
  });

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'free': return <Users className="w-6 h-6" />;
      case 'basic': return <Star className="w-6 h-6" />;
      case 'pro': return <Crown className="w-6 h-6" />;
      case 'enterprise': return <Shield className="w-6 h-6" />;
      default: return <Users className="w-6 h-6" />;
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const formatLimit = (limit: number) => {
    return limit === -1 ? 'Illimité' : limit.toString();
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;

    try {
      const response = await fetch('/api/promotion/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, planId: 2 }),
      });

      const data = await response.json();

      if (response.ok) {
        setAppliedPromo(data.promotion);
        toast({
          title: "Code promo appliqué",
          description: data.message,
        });
      } else {
        toast({
          title: "Erreur",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'appliquer le code promo",
        variant: "destructive",
      });
    }
  };

  const calculateDiscountedPrice = (price: number) => {
    if (!appliedPromo) return price;

    if (appliedPromo.type === 'percentage') {
      const discount = (price * appliedPromo.value) / 100;
      return price - Math.min(discount, appliedPromo.maxDiscount || discount);
    } else if (appliedPromo.type === 'fixed_amount') {
      return Math.max(price - appliedPromo.value, 0);
    }
    return price;
  };

  if (plansLoading || subLoading) {
    return (
      <PageLayout className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-indigo-100 rounded-2xl">
              <Crown className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Plans Premium</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Débloquez tout le potentiel de Wanderlust avec des fonctionnalités IA avancées, un stockage illimité et des outils de collaboration premium.
          </p>
        </div>

        <Tabs defaultValue="plans" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-96 mx-auto mb-8">
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="usage">Utilisation</TabsTrigger>
            <TabsTrigger value="billing">Facturation</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-8">
            {/* Cycle de facturation */}
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl p-2 shadow-sm border">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-6 py-2 rounded-xl font-medium transition-all ${
                      billingCycle === 'monthly'
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Mensuel
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-6 py-2 rounded-xl font-medium transition-all relative ${
                      billingCycle === 'yearly'
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Annuel
                    <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      2 mois gratuits
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Plans d'abonnement */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans?.map((plan) => {
                const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.price;
                const discountedPrice = calculateDiscountedPrice(price);
                const isCurrentPlan = currentSub?.planName === plan.name;

                return (
                  <Card 
                    key={plan.id} 
                    className={`relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl ${
                      plan.isRecommended 
                        ? 'border-indigo-500 shadow-lg scale-105' 
                        : 'border-gray-200 hover:border-indigo-300'
                    } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
                  >
                    {plan.isRecommended && (
                      <div className="absolute top-0 left-0 right-0 bg-indigo-600 text-white text-center py-2 text-sm font-medium">
                        Recommandé
                      </div>
                    )}
                    
                    <CardHeader className={`text-center ${plan.isRecommended ? 'pt-12' : 'pt-6'}`}>
                      <div className="flex justify-center mb-4">
                        <div className={`p-3 rounded-2xl ${
                          plan.name === 'free' ? 'bg-gray-100 text-gray-600' :
                          plan.name === 'basic' ? 'bg-blue-100 text-blue-600' :
                          plan.name === 'pro' ? 'bg-indigo-100 text-indigo-600' :
                          'bg-purple-100 text-purple-600'
                        }`}>
                          {getPlanIcon(plan.name)}
                        </div>
                      </div>
                      <CardTitle className="text-2xl font-bold">
                        {plan.name === 'free' ? 'Gratuit' :
                         plan.name === 'basic' ? 'Basic' :
                         plan.name === 'pro' ? 'Pro' : 'Enterprise'}
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        {plan.name === 'free' ? 'Parfait pour commencer vos aventures' :
                         plan.name === 'basic' ? 'Idéal pour les voyageurs réguliers' :
                         plan.name === 'pro' ? 'Pour les créateurs de contenu et professionnels' :
                         'Solutions complètes pour les équipes'}
                      </CardDescription>
                      
                      <div className="text-center py-4">
                        {plan.price === 0 ? (
                          <div className="text-3xl font-bold text-gray-900">Gratuit</div>
                        ) : (
                          <>
                            {appliedPromo && discountedPrice !== price && (
                              <div className="text-lg text-gray-500 line-through">
                                {price}€/{billingCycle === 'yearly' ? 'an' : 'mois'}
                              </div>
                            )}
                            <div className="text-3xl font-bold text-gray-900">
                              {discountedPrice.toFixed(2)}€
                              <span className="text-lg font-normal text-gray-600">
                                /{billingCycle === 'yearly' ? 'an' : 'mois'}
                              </span>
                            </div>
                            {billingCycle === 'yearly' && (
                              <div className="text-sm text-green-600 font-medium">
                                Économisez {((plan.price * 12 - plan.yearlyPrice) / (plan.price * 12) * 100).toFixed(0)}%
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <ul className="space-y-3">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-sm">
                            {formatLimit(plan.limits.trips)} voyage{plan.limits.trips !== 1 ? 's' : ''}
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-sm">
                            {formatLimit(plan.limits.photosPerMonth)} photos par mois
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-sm">
                            {formatLimit(plan.limits.storageGB)} {plan.limits.storageGB === -1 ? '' : 'GB de'} stockage
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-sm">
                            {formatLimit(plan.limits.aiRequests)} requête{plan.limits.aiRequests !== 1 ? 's' : ''} IA
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-sm">
                            {formatLimit(plan.limits.videoGeneration)} génération{plan.limits.videoGeneration !== 1 ? 's' : ''} de vidéo
                          </span>
                        </li>
                        {plan.name === 'pro' && (
                          <>
                            <li className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-500" />
                              <span className="text-sm">Support prioritaire</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-500" />
                              <span className="text-sm">Analyses avancées</span>
                            </li>
                          </>
                        )}
                        {plan.name === 'enterprise' && (
                          <>
                            <li className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-500" />
                              <span className="text-sm">Support prioritaire</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-500" />
                              <span className="text-sm">Analyses avancées</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-500" />
                              <span className="text-sm">Personnalisation marque</span>
                            </li>
                          </>
                        )}
                      </ul>

                      <Button 
                        className={`w-full mt-6 ${
                          isCurrentPlan 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : plan.isRecommended 
                              ? 'bg-indigo-600 hover:bg-indigo-700' 
                              : 'bg-gray-900 hover:bg-gray-800'
                        }`}
                        disabled={isCurrentPlan}
                      >
                        {isCurrentPlan ? 'Plan actuel' : 
                         plan.price === 0 ? 'Commencer gratuitement' :
                         'Passer au Premium'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Code promo */}
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Code promotionnel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Entrer le code promo"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  <Button onClick={handleApplyPromo} variant="outline">
                    Appliquer
                  </Button>
                </div>
                {appliedPromo && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-medium">
                      Code "{appliedPromo.code}" appliqué ! {appliedPromo.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            {currentSub && (
              <div className="max-w-4xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>Utilisation actuelle</CardTitle>
                    <CardDescription>
                      Suivi de votre utilisation pour la période en cours
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Stockage utilisé</span>
                          <span>
                            {currentSub.usage.storageUsed}GB / {formatLimit(currentSub.limits.storageGB)}GB
                          </span>
                        </div>
                        <Progress 
                          value={getUsagePercentage(currentSub.usage.storageUsed, currentSub.limits.storageGB)} 
                          className="w-full"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Photos téléchargées ce mois</span>
                          <span>
                            {currentSub.usage.photosUploaded} / {formatLimit(currentSub.limits.photosPerMonth)}
                          </span>
                        </div>
                        <Progress 
                          value={getUsagePercentage(currentSub.usage.photosUploaded, currentSub.limits.photosPerMonth)} 
                          className="w-full"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Requêtes IA utilisées</span>
                          <span>
                            {currentSub.usage.aiRequestsUsed} / {formatLimit(currentSub.limits.aiRequests)}
                          </span>
                        </div>
                        <Progress 
                          value={getUsagePercentage(currentSub.usage.aiRequestsUsed, currentSub.limits.aiRequests)} 
                          className="w-full"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Générations de vidéo</span>
                          <span>
                            {currentSub.usage.videoGenerations} / {formatLimit(currentSub.limits.videoGeneration)}
                          </span>
                        </div>
                        <Progress 
                          value={getUsagePercentage(currentSub.usage.videoGenerations, currentSub.limits.videoGeneration)} 
                          className="w-full"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Informations de facturation</CardTitle>
                  <CardDescription>
                    Gérez votre abonnement et vos informations de paiement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentSub ? (
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Plan actuel:</span>
                        <Badge variant="secondary">{currentSub.planName}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Statut:</span>
                        <Badge variant={currentSub.status === 'active' ? 'default' : 'destructive'}>
                          {currentSub.status === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Prochaine facturation:</span>
                        <span>{new Date(currentSub.currentPeriodEnd).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="pt-4 border-t">
                        <Button variant="outline" className="w-full">
                          Gérer l'abonnement
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">Aucun abonnement actif</p>
                      <Button>Choisir un plan</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}