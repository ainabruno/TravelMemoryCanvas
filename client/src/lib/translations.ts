export const translations = {
  // Navigation et général
  navigation: {
    home: "Accueil",
    trips: "Voyages", 
    albums: "Albums",
    photos: "Photos",
    map: "Carte",
    profile: "Profil",
    settings: "Paramètres",
    logout: "Déconnexion"
  },

  // Page d'accueil
  home: {
    title: "Wanderlust",
    subtitle: "Vos souvenirs de voyage, magnifiés par l'IA",
    quickActions: {
      newTrip: "Nouveau Voyage",
      importPhotos: "Importer Photos", 
      sharedAlbum: "Album Partagé",
      aiCreative: "IA Créative"
    },
    stats: {
      trips: "Voyages",
      photos: "Photos",
      countries: "Pays",
      shares: "Partages"
    },
    premiumFeatures: "Fonctionnalités Premium",
    premiumSubtitle: "Débloquez tout le potentiel de Wanderlust"
  },

  // Plans d'abonnement
  subscription: {
    title: "Plans Premium",
    subtitle: "Débloquez tout le potentiel de Wanderlust avec des fonctionnalités IA avancées, un stockage illimité et des outils de collaboration premium.",
    billingCycle: {
      monthly: "Mensuel",
      yearly: "Annuel",
      yearlyDiscount: "2 mois gratuits"
    },
    plans: {
      free: {
        name: "Gratuit",
        description: "Parfait pour commencer vos aventures"
      },
      basic: {
        name: "Basic",
        description: "Idéal pour les voyageurs réguliers"
      },
      pro: {
        name: "Pro", 
        description: "Pour les créateurs de contenu et professionnels"
      },
      enterprise: {
        name: "Enterprise",
        description: "Solutions complètes pour les équipes"
      }
    },
    features: {
      trips: "voyages",
      photos: "photos par mois",
      storage: "stockage",
      aiRequests: "requêtes IA",
      videoGeneration: "génération de vidéos",
      unlimited: "Illimité",
      prioritySupport: "Support prioritaire",
      advancedAnalytics: "Analyses avancées",
      customBranding: "Personnalisation marque"
    },
    buttons: {
      currentPlan: "Plan actuel",
      upgrade: "Passer au Premium",
      downgrade: "Rétrograder",
      manage: "Gérer l'abonnement"
    },
    usage: {
      title: "Utilisation actuelle",
      storageUsed: "Stockage utilisé",
      photosUploaded: "Photos téléchargées",
      aiRequests: "Requêtes IA utilisées"
    }
  },

  // Marketplace
  marketplace: {
    title: "Marketplace",
    subtitle: "Découvrez et vendez des guides de voyage, vidéos et livres photo créés par la communauté",
    categories: {
      all: "Tout",
      guides: "Guides",
      videos: "Vidéos", 
      photoBooks: "Livres Photo",
      presets: "Préréglages",
      templates: "Modèles"
    },
    sort: {
      popular: "Populaire",
      newest: "Plus récent",
      rating: "Mieux noté",
      price: "Prix"
    },
    filters: {
      priceRange: "Gamme de prix",
      rating: "Note minimale",
      verified: "Vendeurs vérifiés uniquement"
    },
    product: {
      by: "par",
      verified: "Vérifié",
      rating: "Note",
      sales: "ventes",
      addToCart: "Ajouter au panier",
      buyNow: "Acheter maintenant",
      preview: "Aperçu"
    }
  },

  // Programme d'affiliation
  affiliate: {
    title: "Programme d'Affiliation",
    subtitle: "Gagnez 20% de commission en recommandant Wanderlust à vos amis et votre audience",
    stats: {
      totalEarnings: "Gains totaux",
      pendingEarnings: "Gains en attente", 
      paidEarnings: "Gains payés",
      totalReferrals: "Total des parrainages",
      activeReferrals: "Parrainages actifs",
      conversionRate: "Taux de conversion"
    },
    referralCode: "Code de parrainage",
    copyCode: "Copier le code",
    shareLink: "Partager le lien",
    recentActivity: "Activité récente",
    payoutHistory: "Historique des paiements"
  },

  // Analyses de revenus  
  revenue: {
    title: "Analyses de Revenus",
    subtitle: "Suivez vos performances financières et optimisez vos revenus",
    overview: {
      totalRevenue: "Revenus totaux",
      monthlyRevenue: "Revenus mensuels",
      subscriptions: "Abonnements",
      marketplace: "Marketplace", 
      affiliate: "Affiliation"
    },
    metrics: {
      growth: "Croissance",
      churn: "Désabonnements",
      conversion: "Conversion"
    }
  },

  // Messages généraux
  common: {
    loading: "Chargement...",
    error: "Erreur",
    success: "Succès",
    cancel: "Annuler",
    save: "Enregistrer",
    delete: "Supprimer",
    edit: "Modifier", 
    share: "Partager",
    upload: "Télécharger",
    download: "Télécharger",
    search: "Rechercher",
    filter: "Filtrer",
    sort: "Trier",
    view: "Voir",
    manage: "Gérer",
    settings: "Paramètres",
    help: "Aide",
    contact: "Contact",
    privacy: "Confidentialité",
    terms: "Conditions"
  },

  // Messages toast
  toast: {
    success: {
      saved: "Enregistré avec succès",
      updated: "Mis à jour avec succès",
      deleted: "Supprimé avec succès",
      copied: "Copié dans le presse-papiers"
    },
    error: {
      generic: "Une erreur s'est produite",
      network: "Erreur de connexion",
      unauthorized: "Non autorisé",
      validation: "Erreur de validation"
    }
  }
};

export type TranslationKey = keyof typeof translations;