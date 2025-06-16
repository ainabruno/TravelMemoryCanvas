import { Camera, Heart, Mail, Phone, MapPin, Globe, Instagram, Facebook, Twitter, Youtube } from "lucide-react";
import { Link } from "wouter";

export default function AppFooter() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    produit: [
      { label: "Fonctionnalités", href: "/ai-analysis" },
      { label: "Tarifs", href: "/subscription" },
      { label: "Marketplace", href: "/marketplace" },
      { label: "Programme d'affiliation", href: "/affiliate" }
    ],
    ressources: [
      { label: "Centre d'aide", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Mentorat", href: "/mentoring" },
      { label: "Communauté", href: "/groups" }
    ],
    entreprise: [
      { label: "À propos", href: "#" },
      { label: "Carrières", href: "#" },
      { label: "Partenaires", href: "#" },
      { label: "Analyses", href: "/admin/revenue" }
    ],
    legal: [
      { label: "Confidentialité", href: "/anonymization" },
      { label: "Conditions d'utilisation", href: "#" },
      { label: "Mentions légales", href: "#" },
      { label: "Cookies", href: "#" }
    ]
  };

  const socialLinks = [
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Youtube, href: "#", label: "YouTube" }
  ];

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      {/* Section principale */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo et description */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Wanderlust</h3>
                <p className="text-sm text-gray-500">Vos souvenirs magnifiés</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6 max-w-md">
              Transformez vos photos de voyage en histoires captivantes avec l'intelligence artificielle. 
              Organisez, partagez et créez des souvenirs inoubliables.
            </p>
            
            {/* Informations de contact */}
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>contact@wanderlust.app</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+33 1 23 45 67 89</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Paris, France</span>
              </div>
            </div>
          </div>

          {/* Liens par catégorie */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Produit</h4>
            <ul className="space-y-2">
              {footerLinks.produit.map((link, index) => (
                <li key={`produit-${index}`}>
                  <Link href={link.href}>
                    <span className="text-gray-600 hover:text-blue-700 transition-colors cursor-pointer">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Ressources</h4>
            <ul className="space-y-2">
              {footerLinks.ressources.map((link, index) => (
                <li key={`ressources-${index}`}>
                  <Link href={link.href}>
                    <span className="text-gray-600 hover:text-blue-700 transition-colors cursor-pointer">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Entreprise</h4>
            <ul className="space-y-2 mb-6">
              {footerLinks.entreprise.map((link, index) => (
                <li key={`entreprise-${index}`}>
                  <Link href={link.href}>
                    <span className="text-gray-600 hover:text-blue-700 transition-colors cursor-pointer">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Liens sociaux */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Suivez-nous</h4>
              <div className="flex space-x-3">
                {socialLinks.map((social, index) => (
                  <a
                    key={`social-${index}`}
                    href={social.href}
                    className="w-9 h-9 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section du bas */}
      <div className="bg-gray-100 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex space-x-6 text-sm text-gray-600">
              {footerLinks.legal.map((link, index) => (
                <Link key={`legal-${index}`} href={link.href}>
                  <span className="hover:text-blue-700 transition-colors cursor-pointer">
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Globe className="w-4 h-4" />
                <span>Français</span>
              </div>
              <p className="text-sm text-gray-600">
                © {currentYear} Wanderlust. Tous droits réservés.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bande de confiance */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <Heart className="w-4 h-4" />
              <span>Créé avec passion pour les voyageurs</span>
            </div>
            <div className="hidden md:block">•</div>
            <div className="hidden md:flex items-center space-x-2">
              <Camera className="w-4 h-4" />
              <span>Plus de 10M de photos organisées</span>
            </div>
            <div className="hidden lg:block">•</div>
            <div className="hidden lg:flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>Disponible dans 15+ pays</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}