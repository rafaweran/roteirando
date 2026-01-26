import React, { useState } from 'react';
import { 
  LogOut, 
  Map, 
  LayoutDashboard, 
  Menu, 
  X, 
  CreditCard, 
  Settings, 
  UserCircle,
  ChevronDown,
  Users,
  TentTree,
  Calendar,
  BookOpen,
  Luggage,
  CalendarPlus
} from 'lucide-react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  onNavigateHome: () => void;
  onNavigateTours: () => void;
  onNavigateGroups: () => void;
  onNavigateFinancial?: () => void;
  onNavigateAgenda?: () => void;
  onNavigateCityGuide?: () => void;
  onNavigateDestinosGuide?: () => void;
  onNavigateMyTrip?: () => void;
  onNavigateCustomTours?: () => void;
  currentView?: string;
  title?: string;
  userRole?: UserRole;
  userName?: string;
  userEmail?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  onLogout, 
  onNavigateHome, 
  onNavigateTours, 
  onNavigateGroups,
  onNavigateFinancial,
  onNavigateAgenda,
  onNavigateCityGuide,
  onNavigateDestinosGuide,
  onNavigateMyTrip,
  onNavigateCustomTours,
  currentView = 'dashboard',
  userRole = 'admin',
  userName = 'Admin User',
  userEmail = 'admin@travel.com'
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSubmenuOpen, setIsMobileSubmenuOpen] = useState(false);

  // --- Desktop Navigation Components ---
  
  const NavItem = ({ icon: Icon, label, isActive, onClick, hasSubmenu, children }: any) => {
    return (
      <div className="relative group h-full flex items-center">
        <button
          onClick={onClick}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 h-10
            ${isActive 
              ? 'bg-primary/10 text-primary' 
              : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }
          `}
        >
          {Icon && <Icon size={18} />}
          <span>{label}</span>
          {hasSubmenu && (
            <ChevronDown size={16} className="text-text-secondary group-hover:text-primary transition-transform duration-200 group-hover:rotate-180" />
          )}
        </button>

        {/* Desktop Dropdown */}
        {hasSubmenu && (
          <div className="absolute top-full left-0 pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
            <div className="bg-white rounded-xl shadow-xl border border-border overflow-hidden p-1">
              {children}
            </div>
          </div>
        )}
      </div>
    );
  };

  const DropdownItem = ({ icon: Icon, label, onClick }: any) => (
    <button
      onClick={(e) => {
        e.stopPropagation(); // Prevent bubbling if needed
        onClick();
      }}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-primary hover:bg-surface transition-colors text-left"
    >
      {Icon && <Icon size={16} />}
      {label}
    </button>
  );

  // --- Mobile Navigation Components ---

  const MobileNavItem = ({ icon: Icon, label, isActive, onClick, hasSubmenu, isOpen, onToggle }: any) => (
    <div className="flex flex-col">
      <button
        onClick={hasSubmenu ? onToggle : onClick}
        className={`
          w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors
          ${isActive 
            ? 'bg-primary/10 text-primary font-medium' 
            : 'text-text-secondary hover:bg-surface hover:text-text-primary'
          }
        `}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={20} />}
          <span>{label}</span>
        </div>
        {hasSubmenu && (
          <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top Header Navigation */}
      <header className="bg-white border-b border-border h-16 fixed top-0 left-0 right-0 z-40 px-3 sm:px-4 md:px-8 shadow-sm/50">
        <div className="max-w-[1600px] mx-auto h-full flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0" onClick={onNavigateHome}>
            <img 
              src="/assets/logo.svg?v=2" 
              alt="Roteirando" 
              className="h-5 sm:h-6 object-contain flex-shrink-0"
              onError={(e) => {
                // Fallback para ícone se a logo não existir
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center text-white shadow-md shadow-primary/20 hidden flex-shrink-0" style={{ display: 'none' }}>
              <Map size={16} className="sm:w-[18px] sm:h-[18px]" />
            </div>
          </div>

          {/* Desktop Menu (Center) */}
          <nav className="hidden md:flex items-center gap-2 h-full">
            {userRole === 'user' ? (
              <>
                <NavItem 
                  icon={Map} 
                  label="Lista de Passeios" 
                  isActive={currentView === 'trip-details' || currentView === 'dashboard'}
                  onClick={onNavigateHome} 
                />
                <NavItem 
                  icon={Calendar} 
                  label="Minha Agenda" 
                  isActive={currentView === 'agenda'}
                  onClick={onNavigateAgenda || onNavigateHome} 
                />
                <NavItem 
                  icon={CalendarPlus} 
                  label="Meus Passeios" 
                  isActive={currentView === 'custom-tours'}
                  onClick={onNavigateCustomTours || onNavigateHome} 
                />
                <NavItem 
                  icon={Luggage} 
                  label="Minha Viagem" 
                  isActive={currentView === 'my-trip'}
                  onClick={onNavigateMyTrip || onNavigateHome} 
                />
                <NavItem 
                  icon={BookOpen} 
                  label="Guia de Destinos" 
                  isActive={currentView === 'destinos-guide'}
                  onClick={onNavigateDestinosGuide || (() => console.warn('onNavigateDestinosGuide não está definido'))}
                />
              </>
            ) : (
              <>
                <NavItem 
                  icon={LayoutDashboard} 
                  label="Dashboard" 
                  isActive={currentView === 'dashboard'}
                  onClick={onNavigateHome} 
                />
                
                <NavItem 
                  icon={Map} 
                  label="Viagens" 
                  isActive={currentView === 'trip-details' || currentView === 'all-tours' || currentView === 'all-groups' || currentView === 'tour-attendance' || currentView === 'tour-detail'} 
                  hasSubmenu={userRole === 'admin'} 
                  onClick={onNavigateHome}
                >
                  {userRole === 'admin' && (
                    <>
                      <DropdownItem icon={Map} label="Minhas Viagens" onClick={onNavigateHome} />
                      <div className="h-px bg-border mx-2 my-1"></div>
                      <DropdownItem icon={TentTree} label="Passeios" onClick={onNavigateTours} />
                      <DropdownItem icon={Users} label="Grupos" onClick={onNavigateGroups} />
                    </>
                  )}
                </NavItem>
              </>
            )}

            {userRole === 'admin' && (
              <>
                <NavItem 
                  icon={CreditCard} 
                  label="Administrativo" 
                  isActive={currentView === 'financial'}
                  onClick={onNavigateFinancial || (() => {})}
                />
                <NavItem 
                  icon={BookOpen} 
                  label="Guia de Cidades" 
                  isActive={currentView === 'city-guide'}
                  onClick={onNavigateCityGuide || onNavigateHome}
                />
                <NavItem icon={Settings} label="Configurações" />
              </>
            )}
          </nav>

          {/* User & Actions (Right) */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 lg:gap-3 pl-2 lg:pl-4 border-l border-border">
              <div className="text-right hidden xl:block">
                <p className="text-sm font-semibold text-text-primary leading-none truncate max-w-[150px]">{userName}</p>
                <p className="text-xs text-text-secondary mt-1 truncate max-w-[150px]">{userEmail}</p>
              </div>
              <div className="w-8 h-8 lg:w-9 lg:h-9 bg-surface rounded-full flex items-center justify-center text-text-secondary border border-border flex-shrink-0">
                <UserCircle size={18} className="lg:w-5 lg:h-5" />
              </div>
              <button 
                onClick={onLogout}
                className="p-1.5 lg:p-2 text-text-secondary hover:text-status-error hover:bg-status-error/5 rounded-full transition-colors flex-shrink-0"
                title="Sair"
              >
                <LogOut size={18} className="lg:w-5 lg:h-5" />
              </button>
            </div>

            {/* Mobile Hamburger */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-text-secondary hover:text-primary hover:bg-surface rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer Content */}
          <div className="absolute top-0 right-0 bottom-0 w-[80%] max-w-xs bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-2">
                <img 
                  src="/assets/logo.svg?v=2" 
                  alt="Roteirando" 
                  className="h-5 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-text-secondary hover:text-status-error rounded-full hover:bg-surface transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {userRole === 'user' ? (
                <>
                  <MobileNavItem 
                    icon={Map} 
                    label="Lista de Passeios" 
                    isActive={currentView === 'trip-details' || currentView === 'dashboard'}
                    onClick={() => {
                      onNavigateHome();
                      setIsMobileMenuOpen(false);
                    }} 
                  />
                  <MobileNavItem 
                    icon={Calendar} 
                    label="Minha Agenda" 
                    isActive={currentView === 'agenda'}
                    onClick={() => {
                      onNavigateAgenda?.();
                      setIsMobileMenuOpen(false);
                    }} 
                  />
                  <MobileNavItem 
                    icon={CalendarPlus} 
                    label="Meus Passeios" 
                    isActive={currentView === 'custom-tours'}
                    onClick={() => {
                      onNavigateCustomTours?.();
                      setIsMobileMenuOpen(false);
                    }} 
                  />
                  <MobileNavItem 
                    icon={Luggage} 
                    label="Minha Viagem" 
                    isActive={currentView === 'my-trip'}
                    onClick={() => {
                      onNavigateMyTrip?.();
                      setIsMobileMenuOpen(false);
                    }} 
                  />
                  <MobileNavItem 
                    icon={BookOpen} 
                    label="Guia de Destinos" 
                    isActive={currentView === 'destinos-guide'}
                    onClick={() => {
                      onNavigateDestinosGuide?.();
                      setIsMobileMenuOpen(false);
                    }} 
                  />
                </>
              ) : (
                <MobileNavItem 
                  icon={LayoutDashboard} 
                  label="Dashboard" 
                  isActive={currentView === 'dashboard'}
                  onClick={() => {
                    onNavigateHome();
                    setIsMobileMenuOpen(false);
                  }} 
                />
              )}
              
              <MobileNavItem 
                icon={Map} 
                label="Viagens" 
                isActive={currentView === 'trip-details' || currentView === 'all-tours' || currentView === 'all-groups' || currentView === 'tour-attendance' || currentView === 'tour-detail'}
                hasSubmenu={userRole === 'admin'}
                isOpen={isMobileSubmenuOpen}
                onToggle={() => setIsMobileSubmenuOpen(!isMobileSubmenuOpen)}
                onClick={userRole === 'user' ? () => {
                   onNavigateHome();
                   setIsMobileMenuOpen(false);
                } : undefined}
              />
              
              {/* Mobile Submenu Accordion */}
              {isMobileSubmenuOpen && userRole === 'admin' && (
                <div className="pl-4 space-y-1 border-l-2 border-border ml-4 animate-in slide-in-from-top-2 duration-200">
                  <button 
                    onClick={() => {
                      onNavigateHome();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${currentView === 'dashboard' ? 'text-primary bg-primary/5 font-medium' : 'text-text-secondary hover:text-primary hover:bg-surface'}`}
                  >
                    <Map size={16} />
                    Minhas Viagens
                  </button>
                  <button 
                    onClick={() => {
                      onNavigateTours();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${currentView === 'all-tours' ? 'text-primary bg-primary/5 font-medium' : 'text-text-secondary hover:text-primary hover:bg-surface'}`}
                  >
                    <TentTree size={16} />
                    Passeios
                  </button>
                  <button 
                    onClick={() => {
                      onNavigateGroups();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${currentView === 'all-groups' ? 'text-primary bg-primary/5 font-medium' : 'text-text-secondary hover:text-primary hover:bg-surface'}`}
                  >
                    <Users size={16} />
                    Grupos
                  </button>
                </div>
              )}

              {userRole === 'admin' && (
                <>
                  <MobileNavItem 
                    icon={CreditCard} 
                    label="Administrativo" 
                    isActive={currentView === 'financial'}
                    onClick={() => {
                      onNavigateFinancial?.();
                      setIsMobileMenuOpen(false);
                    }} 
                  />
                  <MobileNavItem 
                    icon={BookOpen} 
                    label="Guia de Cidades" 
                    isActive={currentView === 'city-guide'}
                    onClick={() => {
                      onNavigateCityGuide?.();
                      setIsMobileMenuOpen(false);
                    }} 
                  />
                  <MobileNavItem icon={Settings} label="Configurações" />
                </>
              )}
            </div>

            <div className="p-4 border-t border-border mt-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-surface rounded-full flex items-center justify-center text-text-secondary border border-border">
                  <UserCircle size={24} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{userName}</p>
                  <p className="text-xs text-text-secondary">{userEmail}</p>
                </div>
              </div>
              <button 
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 text-sm font-medium text-text-secondary hover:text-status-error hover:bg-status-error/5 p-3 rounded-lg border border-border hover:border-status-error/30 transition-all"
              >
                <LogOut size={18} />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full pt-20 sm:pt-24 pb-6 sm:pb-8 px-3 sm:px-4 md:px-8 max-w-[1600px] mx-auto transition-all">
        {children}
      </main>
    </div>
  );
};

export default Layout;