import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription/plans'],
  });

  const { data: currentSub, isLoading: subLoading } = useQuery<CurrentSubscription>({
    queryKey: ['/api/subscription/current'],
  });

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'free': return <Users className="w-6 h-6" />;
      case 'explorer': return <Star className="w-6 h-6" />;
      case 'professional': return <Crown className="w-6 h-6" />;
      case 'enterprise': return <Shield className="w-6 h-6" />;
      default: return <Users className="w-6 h-6" />;
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choisissez votre Plan d'Abonnement
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Débloquez tout le potentiel de Wanderlust avec nos plans premium.
            Fonctionnalités IA avancées, stockage illimité et bien plus encore.
          </p>
        </div>

        <Tabs defaultValue="plans" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-96 mx-auto mb-8">
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="usage">Utilisation</TabsTrigger>
            <TabsTrigger value="billing">Facturation</TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-8">
            {/* Billing Cycle Toggle */}
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl p-2 shadow-sm border">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-6 py-2 rounded-xl font-medium transition-all ${
                      billingCycle === 'monthly'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-indigo-600'
                    }`}
                  >
                    Mensuel
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-6 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                      billingCycle === 'yearly'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-indigo-600'
                    }`}
                  >
                    Annuel
                    <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                      -20%
                    </Badge>
                  </button>
                </div>
              </div>
            </div>

            {/* Promo Code */}
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-green-600" />
                  Code Promo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Entrez votre code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleApplyPromo} variant="outline">
                    Appliquer
                  </Button>
                </div>
                {appliedPromo && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 text-sm font-medium">
                      {appliedPromo.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Plans Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans?.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative transition-all duration-200 hover:shadow-xl ${
                    plan.isRecommended
                      ? 'border-2 border-indigo-500 shadow-lg scale-105'
                      : 'border border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  {plan.isRecommended && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-indigo-600 text-white px-4 py-1">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Recommandé
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-3">
                      <div className={`p-3 rounded-2xl ${
                        plan.name === 'free' ? 'bg-gray-100' :
                        plan.name === 'explorer' ? 'bg-blue-100' :
                        plan.name === 'professional' ? 'bg-purple-100' :
                        'bg-amber-100'
                      }`}>
                        {getPlanIcon(plan.name)}
                      </div>
                    </div>
                    <CardTitle className="text-xl">{plan.displayName}</CardTitle>
                    <CardDescription className="text-sm">
                      {plan.description}
                    </CardDescription>
                    
                    <div className="mt-4">
                      <div className="text-3xl font-bold text-gray-900">
                        {billingCycle === 'monthly' ? (
                          <>
                            {appliedPromo && plan.name !== 'free' ? (
                              <div className="space-y-1">
                                <span className="text-lg line-through text-gray-400">
                                  {plan.price}€
                                </span>
                                <div>{calculateDiscountedPrice(plan.price).toFixed(2)}€</div>
                              </div>
                            ) : (
                              <>{plan.price}€</>
                            )}
                          </>
                        ) : (
                          <>
                            {appliedPromo && plan.name !== 'free' ? (
                              <div className="space-y-1">
                                <span className="text-lg line-through text-gray-400">
                                  {plan.yearlyPrice}€
                                </span>
                                <div>{calculateDiscountedPrice(plan.yearlyPrice).toFixed(2)}€</div>
                              </div>
                            ) : (
                              <>{plan.yearlyPrice}€</>
                            )}
                          </>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mt-1">
                        {plan.price === 0 ? 'Gratuit' : `par ${billingCycle === 'monthly' ? 'mois' : 'an'}`}
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full ${
                        plan.isRecommended
                          ? 'bg-indigo-600 hover:bg-indigo-700'
                          : 'bg-gray-900 hover:bg-gray-800'
                      }`}
                      disabled={currentSub?.planName === plan.name}
                    >
                      {currentSub?.planName === plan.name ? (
                        'Plan Actuel'
                      ) : plan.price === 0 ? (
                        'Commencer Gratuitement'
                      ) : (
                        'Choisir ce Plan'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            {currentSub && (
              <div className="max-w-4xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Utilisation Actuelle - Plan {currentSub.planName.charAt(0).toUpperCase() + currentSub.planName.slice(1)}
                    </CardTitle>
                    <CardDescription>
                      Période du {new Date(currentSub.currentPeriodStart).toLocaleDateString()} au{' '}
                      {new Date(currentSub.currentPeriodEnd).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label>Stockage</Label>
                          <span className="text-sm text-gray-600">
                            {currentSub.usage.storageUsed} MB / {formatLimit(currentSub.limits.storageGB * 1024)} MB
                          </span>
                        </div>
                        <Progress 
                          value={getUsagePercentage(currentSub.usage.storageUsed, currentSub.limits.storageGB * 1024)} 
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label>Photos ce mois</Label>
                          <span className="text-sm text-gray-600">
                            {currentSub.usage.photosUploaded} / {formatLimit(currentSub.limits.photosPerMonth)}
                          </span>
                        </div>
                        <Progress 
                          value={getUsagePercentage(currentSub.usage.photosUploaded, currentSub.limits.photosPerMonth)} 
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label>Requêtes IA</Label>
                          <span className="text-sm text-gray-600">
                            {currentSub.usage.aiRequestsUsed} / {formatLimit(currentSub.limits.aiRequests)}
                          </span>
                        </div>
                        <Progress 
                          value={getUsagePercentage(currentSub.usage.aiRequestsUsed, currentSub.limits.aiRequests)} 
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label>Vidéos générées</Label>
                          <span className="text-sm text-gray-600">
                            {currentSub.usage.videoGenerations} / {formatLimit(currentSub.limits.videoGeneration)}
                          </span>
                        </div>
                        <Progress 
                          value={getUsagePercentage(currentSub.usage.videoGenerations, currentSub.limits.videoGeneration)} 
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label>Albums partagés</Label>
                          <span className="text-sm text-gray-600">
                            {currentSub.usage.sharedAlbums}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-green-600 rounded-full transition-all duration-300"
                            style={{ width: '60%' }}
                          />
                        </div>
                      </div>
                    </div>

                    {currentSub.planName === 'free' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <h3 className="font-medium text-blue-900">Passez au plan Explorateur</h3>
                            <p className="text-blue-700 text-sm mt-1">
                              Débloquez l'analyse IA, plus de stockage et des fonctionnalités avancées.
                            </p>
                            <Button size="sm" className="mt-3 bg-blue-600 hover:bg-blue-700">
                              Améliorer maintenant
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Historique de Facturation</CardTitle>
                  <CardDescription>
                    Gérez vos paiements et téléchargez vos factures
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Plan Gratuit</p>
                        <p className="text-sm text-gray-600">Période actuelle</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">0,00 €</p>
                        <Badge variant="outline" className="text-green-600">
                          Actif
                        </Badge>
                      </div>
                    </div>

                    <div className="text-center py-8 text-gray-500">
                      <p>Aucun autre paiement pour le moment</p>
                    </div>
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