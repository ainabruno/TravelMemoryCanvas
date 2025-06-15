import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingBag, UserPlus, Calendar, Download, Filter } from 'lucide-react';

interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: number;
  subscriptions: {
    active: number;
    growth: number;
    churn: number;
  };
  marketplace: {
    totalSales: number;
    commission: number;
    topCategories: Array<{
      name: string;
      revenue: number;
      sales: number;
    }>;
  };
  affiliate: {
    totalCommissions: number;
    activeAffiliates: number;
    conversionRate: number;
  };
  monthlyData: Array<{
    month: string;
    revenue: number;
    subscriptions: number;
    marketplace: number;
  }>;
}

export default function RevenueAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('12months');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  const { data: revenueData, isLoading } = useQuery<RevenueData>({
    queryKey: ['/api/revenue/analytics', { period: selectedPeriod }],
  });

  const periods = [
    { value: '7days', label: '7 derniers jours' },
    { value: '30days', label: '30 derniers jours' },
    { value: '3months', label: '3 derniers mois' },
    { value: '12months', label: '12 derniers mois' },
    { value: 'ytd', label: 'Année en cours' }
  ];

  const metrics = [
    { value: 'revenue', label: 'Revenus' },
    { value: 'users', label: 'Utilisateurs' },
    { value: 'conversion', label: 'Conversions' },
    { value: 'retention', label: 'Rétention' }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!revenueData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Données non disponibles</h1>
            <p className="text-gray-600">Les analyses de revenus seront disponibles une fois que vous aurez des données.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-2xl">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Analyses de Revenus</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Suivez vos performances financières et optimisez vos sources de revenus
          </p>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-48">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Métrique" />
            </SelectTrigger>
            <SelectContent>
              {metrics.map((metric) => (
                <SelectItem key={metric.value} value={metric.value}>
                  {metric.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-96 mx-auto mb-8">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="affiliate">Affiliation</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Métriques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Revenus totaux</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {formatCurrency(revenueData.totalRevenue)}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +12.5% vs mois dernier
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Revenus mensuels</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {formatCurrency(revenueData.monthlyRevenue)}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +8.3% vs mois dernier
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Abonnements actifs</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {revenueData.subscriptions.active}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {formatPercentage(revenueData.subscriptions.growth)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Ventes marketplace</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {formatCurrency(revenueData.marketplace.totalSales)}
                      </p>
                    </div>
                    <div className="p-3 bg-amber-100 rounded-full">
                      <ShoppingBag className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +15.2% vs mois dernier
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Graphique des revenus */}
            <Card>
              <CardHeader>
                <CardTitle>Évolution des revenus</CardTitle>
                <CardDescription>
                  Tendance des revenus par source sur les 12 derniers mois
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stackId="1" 
                        stroke="#3B82F6" 
                        fill="#3B82F6" 
                        name="Revenus totaux"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="subscriptions" 
                        stackId="1" 
                        stroke="#10B981" 
                        fill="#10B981" 
                        name="Abonnements"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="marketplace" 
                        stackId="1" 
                        stroke="#F59E0B" 
                        fill="#F59E0B" 
                        name="Marketplace"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Répartition des revenus */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Répartition des revenus</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Abonnements', value: revenueData.monthlyRevenue * 0.6, color: '#3B82F6' },
                            { name: 'Marketplace', value: revenueData.monthlyRevenue * 0.3, color: '#10B981' },
                            { name: 'Affiliation', value: revenueData.monthlyRevenue * 0.1, color: '#F59E0B' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {[
                            { name: 'Abonnements', value: revenueData.monthlyRevenue * 0.6, color: '#3B82F6' },
                            { name: 'Marketplace', value: revenueData.monthlyRevenue * 0.3, color: '#10B981' },
                            { name: 'Affiliation', value: revenueData.monthlyRevenue * 0.1, color: '#F59E0B' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Indicateurs clés</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Taux de croissance mensuel</span>
                    <Badge className="bg-green-100 text-green-800">+12.5%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Churn rate abonnements</span>
                    <Badge variant="secondary">{revenueData.subscriptions.churn}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Commission marketplace</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {formatCurrency(revenueData.marketplace.commission)}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Affiliés actifs</span>
                    <Badge className="bg-amber-100 text-amber-800">
                      {revenueData.affiliate.activeAffiliates}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Abonnements actifs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {revenueData.subscriptions.active}
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {formatPercentage(revenueData.subscriptions.growth)} ce mois
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Taux de désabonnement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    {revenueData.subscriptions.churn}%
                  </div>
                  <div className="flex items-center text-sm text-red-600">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    -0.5% vs mois dernier
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenus récurrents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {formatCurrency(revenueData.monthlyRevenue * 0.6)}
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +8.3% ce mois
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Catégories les plus vendues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {revenueData.marketplace.topCategories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-gray-600">{category.sales} ventes</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(category.revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance marketplace</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Ventes totales</span>
                      <span>{formatCurrency(revenueData.marketplace.totalSales)}</span>
                    </div>
                    <Progress value={75} className="w-full" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Commission générée</span>
                      <span>{formatCurrency(revenueData.marketplace.commission)}</span>
                    </div>
                    <Progress value={60} className="w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="affiliate" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Commissions totales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-600 mb-2">
                    {formatCurrency(revenueData.affiliate.totalCommissions)}
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +25.3% ce mois
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Affiliés actifs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {revenueData.affiliate.activeAffiliates}
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <UserPlus className="w-4 h-4 mr-1" />
                    +12 nouveaux ce mois
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Taux de conversion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {revenueData.affiliate.conversionRate}%
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +2.1% vs mois dernier
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