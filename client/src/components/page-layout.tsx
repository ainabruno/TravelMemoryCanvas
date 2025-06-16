import NavigationMenu from '@/components/navigation-menu';
import AppFooter from '@/components/app-footer';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageLayout({ children, className = "" }: PageLayoutProps) {
  return (
    <div className={`min-h-screen ${className}`}>
      <NavigationMenu />
      {children}
      <AppFooter />
    </div>
  );
}