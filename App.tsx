import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import Layout from './components/Layout';
import TripCard from './components/TripCard';
import TripDetails from './components/TripDetails';
import NewTourForm from './components/NewTourForm';
import NewTripForm from './components/NewTripForm';
import NewGroupForm from './components/NewGroupForm';
import ToursList from './components/ToursList';
import GroupsList from './components/GroupsList';
import TourAttendanceView from './components/TourAttendanceView';
import TourDetailPage from './components/TourDetailPage';
import FinancialView from './components/FinancialView';
import ChangePasswordModal from './components/ChangePasswordModal';
import ChangePasswordModalAdmin from './components/ChangePasswordModalAdmin';
import TourAgenda from './components/TourAgenda';
import CityGuide from './components/CityGuide';
import DestinosGuide from './components/DestinosGuide';
import MyTripPage from './components/MyTripPage';
import UserCustomToursPage from './components/UserCustomToursPage';
import { ToastProvider, useToast } from './hooks/useToast';
import { Trip, Tour, UserRole, Group } from './types';
import { tripsApi, toursApi, groupsApi, adminsApi } from './lib/database';
import { Plus } from 'lucide-react';
import Button from './components/Button';

type View = 'login' | 'dashboard' | 'trip-details' | 'new-tour' | 'edit-tour' | 'new-trip' | 'new-group' | 'edit-group' | 'all-tours' | 'all-groups' | 'tour-attendance' | 'tour-detail' | 'financial' | 'agenda' | 'city-guide' | 'destinos-guide' | 'my-trip' | 'custom-tours';

const AppContent: React.FC = () => {
  const { showSuccess, showError, showWarning } = useToast();
  const [currentView, setCurrentView] = useState<View>('login');
  
  // User Session State
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [currentUserGroup, setCurrentUserGroup] = useState<Group | null>(null);

  // Data State - Carregar do banco de dados
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [selectedTourForAttendance, setSelectedTourForAttendance] = useState<Tour | null>(null);
  const [selectedTourForDetail, setSelectedTourForDetail] = useState<Tour | null>(null);
  const [selectedTourForGroups, setSelectedTourForGroups] = useState<string | null>(null);
  const [tripDetailsInitialTab, setTripDetailsInitialTab] = useState<'tours' | 'groups'>('tours');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showChangePasswordModalAdmin, setShowChangePasswordModalAdmin] = useState(false);
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string | null>(null);
  const [currentAdminPasswordHash, setCurrentAdminPasswordHash] = useState<string | null>(null);
  
  // Histórico de navegação para suporte ao botão voltar do navegador
  const [navigationHistory, setNavigationHistory] = useState<Array<{ view: View; tripId?: string | null; tourId?: string | null }>>([]);
  const [isNavigatingBack, setIsNavigatingBack] = useState(false);

  // Load data functions
  const loadTrips = async () => {
    try {
      setLoading(true);
      const data = await tripsApi.getAll();
      setTrips(data);
      console.log('✅ Viagens carregadas:', data.length);
    } catch (err: any) {
      console.error('Erro ao carregar viagens:', err);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTours = async () => {
    try {
      const data = await toursApi.getAll();
      setTours(data);
      console.log('✅ Passeios carregados:', data.length);
    } catch (err: any) {
      console.error('Erro ao carregar passeios:', err);
      setTours([]);
    }
  };

  const loadGroups = async () => {
    try {
      const data = await groupsApi.getAll();
      setGroups(data);
      console.log('✅ Grupos carregados:', data.length);
    } catch (err: any) {
      console.error('Erro ao carregar grupos:', err);
      setGroups([]);
    }
  };

  // Limpar qualquer sessão antiga ao carregar a página (segurança)
  useEffect(() => {
    // Sempre limpar sessão antiga e exigir login real
    localStorage.removeItem('roteirando_session');
    setCurrentView('login');
    console.log('🔒 Sistema de login: sessão antiga removida, login obrigatório');
    
    // Inicializar histórico de navegação
    setNavigationHistory([{ view: 'login' }]);
  }, []); // Executar apenas uma vez ao montar

  // Função para adicionar entrada ao histórico e atualizar URL
  const navigateToView = (view: View, tripId?: string | null, tourId?: string | null, addToHistory: boolean = true) => {
    // Se estiver navegando para trás, apenas atualizar o estado sem adicionar ao histórico
    if (isNavigatingBack) {
      setIsNavigatingBack(false);
      // Apenas atualizar estado, não adicionar ao histórico
      setCurrentView(view);
      if (tripId !== undefined) setSelectedTripId(tripId);
      if (tourId !== undefined) {
        if (view === 'tour-detail') {
          const tour = tours.find(t => t.id === tourId);
          if (tour) setSelectedTourForDetail(tour);
        } else if (view === 'tour-attendance') {
          const tour = tours.find(t => t.id === tourId);
          if (tour) setSelectedTourForAttendance(tour);
        }
      }
      return;
    }
    
    if (addToHistory && currentView !== 'login') {
      // Adicionar estado atual ao histórico antes de mudar
      const currentState = {
        view: currentView,
        tripId: selectedTripId,
        tourId: selectedTourForDetail?.id || selectedTourForAttendance?.id || undefined
      };
      
      setNavigationHistory(prev => {
        // Não adicionar se for o mesmo estado
        const lastState = prev[prev.length - 1];
        if (lastState && 
            lastState.view === currentState.view && 
            lastState.tripId === currentState.tripId && 
            lastState.tourId === currentState.tourId) {
          return prev;
        }
        return [...prev, currentState];
      });
      
      // Adicionar ao histórico do navegador
      window.history.pushState(
        { view, tripId, tourId },
        '',
        `#${view}${tripId ? `-${tripId}` : ''}${tourId ? `-${tourId}` : ''}`
      );
    }
    
    // Atualizar estado
    setCurrentView(view);
    if (tripId !== undefined) setSelectedTripId(tripId);
    if (tourId !== undefined) {
      if (view === 'tour-detail') {
        const tour = tours.find(t => t.id === tourId);
        if (tour) setSelectedTourForDetail(tour);
      } else if (view === 'tour-attendance') {
        const tour = tours.find(t => t.id === tourId);
        if (tour) setSelectedTourForAttendance(tour);
      }
    }
  };

  // Ouvir eventos de popstate (botão voltar/avançar do navegador)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        setIsNavigatingBack(true);
        const { view, tripId, tourId } = event.state;
        setCurrentView(view as View);
        if (tripId !== undefined) setSelectedTripId(tripId);
        if (tourId !== undefined) {
          if (view === 'tour-detail') {
            const tour = tours.find(t => t.id === tourId);
            if (tour) setSelectedTourForDetail(tour);
          } else if (view === 'tour-attendance') {
            const tour = tours.find(t => t.id === tourId);
            if (tour) setSelectedTourForAttendance(tour);
          }
        }
      } else {
        // Se não houver state, usar window.history.back() ou voltar para login
        setNavigationHistory(prev => {
          if (prev.length > 1) {
            const previousState = prev[prev.length - 2];
            setIsNavigatingBack(true);
            setCurrentView(previousState.view);
            if (previousState.tripId !== undefined) setSelectedTripId(previousState.tripId);
            if (previousState.tourId !== undefined) {
              const tour = tours.find(t => t.id === previousState.tourId);
              if (tour) {
                if (previousState.view === 'tour-detail') {
                  setSelectedTourForDetail(tour);
                } else if (previousState.view === 'tour-attendance') {
                  setSelectedTourForAttendance(tour);
                }
              }
            }
            return prev.slice(0, -1);
          } else {
            // Voltar para login se não houver histórico
            setCurrentView('login');
            return [{ view: 'login' }];
          }
        });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [tours]);

  // Load all data when user logs in (apenas se ainda não foram carregados)
  useEffect(() => {
    if (currentView !== 'login' && userRole === 'admin' && trips.length === 0 && tours.length === 0 && groups.length === 0) {
      Promise.all([loadTrips(), loadTours(), loadGroups()]);
    }
  }, [currentView, userRole]);


  const handleLoginSuccess = async (role: UserRole, group?: Group, adminData?: { email: string; password: string | null; passwordChanged?: boolean | null }) => {
    try {
      setUserRole(role);
      
      if (role === 'user' && group) {
        setCurrentUserGroup(group);
        setSelectedTripId(group.tripId);
        
        // Não salvar sessão no localStorage por segurança
        // O usuário deve fazer login sempre que acessar o sistema
        
        // Carregar dados em paralelo para melhor performance
        const [updatedGroup] = await Promise.all([
          groupsApi.getById(group.id).catch(() => group),
          loadTrips(),
          loadTours(),
          loadGroups()
        ]);
        
        if (updatedGroup) {
          setCurrentUserGroup(updatedGroup);
          
          // Verificar se precisa alterar senha (primeiro acesso)
          if (!updatedGroup.passwordChanged) {
            setShowChangePasswordModal(true);
          }
        }
        
        if (group.tripId) {
          navigateToView('trip-details', group.tripId);
        } else {
          navigateToView('trip-details', null);
        }
      } else {
        // Não salvar sessão do admin no localStorage por segurança
        // O admin deve fazer login sempre que acessar o sistema
        
        // Admin: carregar todos os dados em paralelo
        await Promise.all([
          loadTrips(),
          loadTours(),
          loadGroups()
        ]);
        
        // Verificar se admin precisa alterar senha (primeiro acesso)
        if (adminData && adminData.password && !adminData.passwordChanged) {
          setCurrentAdminEmail(adminData.email);
          setCurrentAdminPasswordHash(adminData.password);
          setShowChangePasswordModalAdmin(true);
        }
        
        navigateToView('dashboard', null);
      }
    } catch (err) {
      console.error('Erro no handleLoginSuccess:', err);
      showError('Erro ao fazer login. Tente novamente.');
    }
  };

  const handlePasswordChangeSuccess = async () => {
    setShowChangePasswordModal(false);
    // Recarregar grupo para atualizar o estado
    if (currentUserGroup) {
      try {
        const updatedGroup = await groupsApi.getById(currentUserGroup.id);
        if (updatedGroup) {
          setCurrentUserGroup(updatedGroup);
        }
      } catch (err) {
        console.error('Erro ao recarregar grupo após alteração de senha:', err);
      }
    }
  };

  const handleLogout = () => {
    // Limpar sessão do localStorage
    localStorage.removeItem('roteirando_session');
    setNavigationHistory([{ view: 'login' }]);
    setCurrentView('login');
    setSelectedTripId(null);
    setUserRole('admin');
    setCurrentUserGroup(null);
    setCurrentAdminEmail(null);
    setCurrentAdminPasswordHash(null);
  };

  const handleTripClick = (trip: Trip) => {
    setTripDetailsInitialTab('tours');
    navigateToView('trip-details', trip.id);
  };

  const handleNavigateHome = () => {
    if (userRole === 'user') {
      const tripId = currentUserGroup?.tripId || null;
      navigateToView('trip-details', tripId);
    } else {
      navigateToView('dashboard', null);
    }
  };

  const handleNavigateAgenda = () => {
    navigateToView('agenda');
  };

  const handleNavigateTours = () => {
    navigateToView('all-tours', null);
  };

  const handleNavigateGroups = () => {
    navigateToView('all-groups', null);
  };

  const handleNavigateFinancial = () => {
    navigateToView('financial', null);
  };

  const handleNavigateCityGuide = () => {
    navigateToView('city-guide', null);
  };

  const handleNavigateDestinosGuide = () => {
    console.log('🚀 Navegando para Guia de Destinos');
    navigateToView('destinos-guide', null);
    console.log('✅ currentView definido como: destinos-guide');
  };

  const handleNavigateMyTrip = () => {
    navigateToView('my-trip', null);
  };

  const handleNavigateCustomTours = () => {
    navigateToView('custom-tours', null);
  };

  const handleNewTourClick = () => {
    console.log('🔄 handleNewTourClick: Criando novo passeio...');
    setEditingTour(null);
    navigateToView('new-tour', null);
    console.log('✅ handleNewTourClick: View alterada para new-tour');
  };

  const handleEditTour = (tour: Tour) => {
    setEditingTour(tour);
    navigateToView('edit-tour', tour.tripId);
  };

  const handleViewTourAttendance = (tour: Tour) => {
    // Quando clica em "Ver Lista", ir para a aba de grupos do TripDetails com o passeio selecionado
    setSelectedTourForGroups(tour.id);
    setTripDetailsInitialTab('groups');
    navigateToView('trip-details', tour.tripId);
  };

  const handleViewTourDetail = (tour: Tour) => {
    setSelectedTourForDetail(tour);
    navigateToView('tour-detail', tour.tripId, tour.id);
  };

  const handleBackFromTourDetail = () => {
    // Usar histórico do navegador para voltar
    window.history.back();
  };

  const handleDeleteTour = (tourId: string) => {
    console.log(`Deleted tour with ID: ${tourId}`);
  };
  
  const handleDeleteGroup = async (groupId: string) => {
    try {
      await groupsApi.delete(groupId);
      showSuccess('Grupo deletado com sucesso!');
      // Recarregar grupos após deletar
      await loadGroups();
    } catch (error: any) {
      console.error('Erro ao deletar grupo:', error);
      const errorMessage = error?.message || error?.error?.message || 'Erro desconhecido';
      showError(`Erro ao deletar grupo: ${errorMessage}`);
      throw error; // Re-throw para que o componente possa tratar
    }
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    navigateToView('edit-group', group.tripId);
  };

  const handleViewGroup = (tripId: string) => {
    setTripDetailsInitialTab('groups');
    setSelectedTourForGroups(null); // Limpar filtro de passeio
    navigateToView('trip-details', tripId);
  };

  const handleViewTourGroups = (tour: Tour) => {
    // Visualizar grupos que confirmaram presença neste passeio específico
    setSelectedTourForGroups(tour.id);
    setTripDetailsInitialTab('groups');
    navigateToView('trip-details', tour.tripId);
  };

  const handleNewGroupClick = () => {
    setEditingGroup(null);
    navigateToView('new-group', selectedTripId);
  };

  const handleNewTripClick = () => {
    navigateToView('new-trip', null);
  };

  const handleSaveTour = async (tourData: any) => {
    try {
      setLoading(true);
      if (editingTour) {
        await toursApi.update(editingTour.id, tourData);
        showSuccess('Passeio atualizado com sucesso!');
      } else {
        await toursApi.create(tourData);
        showSuccess('Seu passeio foi criado com sucesso!');
      }
      // Recarregar passeios após salvar
      await loadTours();
      if (selectedTripId) {
        setTripDetailsInitialTab('tours');
      navigateToView('trip-details', selectedTripId);
    } else {
      navigateToView('all-tours', null);
    }
    setEditingTour(null);
    } catch (err: any) {
      console.error('Erro ao salvar passeio:', err);
      showError(`Erro ao salvar passeio: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelNewTour = () => {
    window.history.back();
    setEditingTour(null);
  };

  const handleSaveGroup = async (groupData: any) => {
    try {
      setLoading(true);
      
      if (editingGroup) {
        // EDITAR GRUPO EXISTENTE
        const groupToUpdate = {
          name: groupData.name,
          membersCount: parseInt(groupData.totalPeople) || groupData.membersCount || 0,
          members: groupData.members || [],
          leaderName: groupData.leaderName,
          leaderEmail: groupData.leaderEmail,
          leaderPhone: groupData.leaderPhone || '',
          tripId: groupData.tripId,
          // Se senha foi alterada, usar a nova, senão manter a existente
          leaderPassword: groupData.leaderPassword || editingGroup.leaderPassword,
          // Manter passwordChanged do grupo original
          passwordChanged: editingGroup.passwordChanged !== undefined ? editingGroup.passwordChanged : false,
        };
        
        console.log('📝 App.tsx - Atualizando grupo:', {
          id: editingGroup.id,
          name: groupToUpdate.name,
          leaderEmail: groupToUpdate.leaderEmail,
        });
        
        await groupsApi.update(editingGroup.id, groupToUpdate);
        
        // Recarregar grupos após atualizar
        await loadGroups();
        
        showSuccess('Grupo atualizado com sucesso!');
      } else {
        // CRIAR NOVO GRUPO
        // Garantir que password_changed seja false para novos grupos
        // IMPORTANTE: Manter todos os campos do grupo, especialmente leaderEmail e leaderPassword
        const groupToSave = {
          name: groupData.name,
          membersCount: parseInt(groupData.totalPeople) || groupData.membersCount || 0,
          members: groupData.members || [],
          leaderName: groupData.leaderName,
          leaderEmail: groupData.leaderEmail, // CRÍTICO: email do responsável
          leaderPhone: groupData.leaderPhone || '',
          leaderPassword: groupData.leaderPassword, // CRÍTICO: senha hasheada
          tripId: groupData.tripId,
          passwordChanged: false, // Primeiro acesso, precisa alterar senha
        };
        
        console.log('📝 App.tsx - Salvando grupo:', {
          name: groupToSave.name,
          leaderEmail: groupToSave.leaderEmail,
          hasPassword: !!groupToSave.leaderPassword,
          tripId: groupToSave.tripId
        });
        
        await groupsApi.create(groupToSave);
        
        // Recarregar grupos após salvar
        await loadGroups();
        
        showSuccess('Grupo criado com sucesso! O responsável receberá as credenciais de acesso.');
      }
      
      // Limpar estado de edição
      setEditingGroup(null);
      
      // Navegar de volta
      if (selectedTripId) {
        setTripDetailsInitialTab('groups');
        navigateToView('trip-details', selectedTripId);
      } else {
        navigateToView('all-groups', null);
      }
    } catch (err: any) {
      console.error('❌ Erro ao salvar grupo:', err);
      console.error('❌ Detalhes do erro:', {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code
      });
      showError(`Erro ao salvar grupo: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelNewGroup = () => {
    setEditingGroup(null);
    window.history.back();
  };

  const handleSaveTrip = async (tripData: any) => {
    try {
      setLoading(true);
      console.log('🔄 handleSaveTrip: Iniciando salvamento...', tripData);
      
      // Validação básica
      if (!tripData.name || !tripData.destination || !tripData.startDate || !tripData.endDate) {
        showWarning('Por favor, preencha todos os campos obrigatórios.');
        setLoading(false);
        return;
      }
      
      // Determinar status baseado na data
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(tripData.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(tripData.endDate);
      endDate.setHours(0, 0, 0, 0);
      
      let status: 'active' | 'upcoming' | 'completed' = 'upcoming';
      if (endDate < today) {
        status = 'completed';
      } else if (startDate <= today && today <= endDate) {
        status = 'active';
      }
      
      // Preparar dados para o banco
      const tripToSave = {
        name: tripData.name.trim(),
        destination: tripData.destination.trim(),
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        description: tripData.description?.trim() || '',
        status: status,
        imageUrl: tripData.imageUrl || '',
        links: tripData.links || []
      };
      
      console.log('📤 Salvando viagem no banco:', {
        ...tripToSave,
        linksCount: tripToSave.links.length
      });
      
      const savedTrip = await tripsApi.create(tripToSave);
      console.log('✅ Viagem salva com sucesso!', savedTrip);
      
      // Recarregar viagens após salvar
      await loadTrips();
      
      // Navegar para dashboard
      navigateToView('dashboard', null);
      
      // Mostrar feedback de sucesso
      showSuccess('Viagem criada com sucesso!');
      
    } catch (err: any) {
      console.error('❌ Erro ao salvar viagem:', err);
      const errorMessage = err.message || err.error?.message || 'Erro desconhecido ao salvar viagem';
      showError(`Erro ao salvar viagem: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelNewTrip = () => {
    window.history.back();
  };

  // User Selection Logic (Granular Attendance)
  const handleSaveAttendance = async (tourId: string, members: string[], customDate?: string | null, cancelReason?: string, selectedPriceKey?: string) => {
    if (userRole !== 'user' || !currentUserGroup) return;

    console.log('💾 App.tsx - handleSaveAttendance chamado:', {
      tourId,
      membersCount: members.length,
      customDate,
      selectedPriceKey,
      hasSelectedPriceKey: !!selectedPriceKey
    });

    try {
      // Salvar no banco de dados
      const { tourAttendanceApi } = await import('./lib/database');
      await tourAttendanceApi.saveAttendance(currentUserGroup.id, tourId, members, customDate, selectedPriceKey);

      console.log('✅ App.tsx - Presença salva no banco com selectedPriceKey:', selectedPriceKey);

      // Log do motivo se for cancelamento
      if (members.length === 0 && cancelReason) {
        console.log(`🚫 Cancelamento do passeio ${tourId} pelo grupo ${currentUserGroup.name}`);
        console.log(`📝 Motivo: ${cancelReason}`);
        // TODO: Em produção, salvar o motivo em uma tabela separada ou adicionar coluna cancellation_reason na tabela tour_attendance
      }

      // Create a new attendance record
      const updatedAttendance = {
          ...currentUserGroup.tourAttendance,
          [tourId]: {
            members: members,
            customDate: customDate || null,
            selectedPriceKey: selectedPriceKey || undefined
          }
      };
      
      console.log('📝 App.tsx - updatedAttendance criado:', {
        tourId,
        attendance: updatedAttendance[tourId]
      });

      // If member list is empty, we can clean up the key (optional)
      if (members.length === 0) {
          delete updatedAttendance[tourId];
      }

      // Update local state
      const updatedGroup = {
          ...currentUserGroup,
          tourAttendance: updatedAttendance
      };
      setCurrentUserGroup(updatedGroup);
      
      if (members.length > 0) {
        console.log(`✅ User ${currentUserGroup.leaderName} updated attendance for tour ${tourId}. Members going:`, members);
      }
      
      // Recarregar grupos para ter dados atualizados
      await loadGroups();
      
      // Após recarregar, atualizar currentUserGroup com os dados mais recentes do banco
      try {
        const refreshedGroup = await groupsApi.getById(currentUserGroup.id);
        if (refreshedGroup) {
          console.log('🔄 App.tsx - Grupo recarregado do banco:', {
            groupId: refreshedGroup.id,
            groupName: refreshedGroup.name,
            tourAttendance: refreshedGroup.tourAttendance ? Object.keys(refreshedGroup.tourAttendance) : [],
            attendanceForTour: refreshedGroup.tourAttendance?.[tourId] ? {
              members: (refreshedGroup.tourAttendance[tourId] as any)?.members || [],
              selectedPriceKey: (refreshedGroup.tourAttendance[tourId] as any)?.selectedPriceKey,
              customDate: (refreshedGroup.tourAttendance[tourId] as any)?.customDate
            } : null
          });
          setCurrentUserGroup(refreshedGroup);
          console.log('✅ currentUserGroup atualizado após salvar presença');
        }
      } catch (err) {
        console.warn('⚠️ Não foi possível atualizar currentUserGroup após salvar presença:', err);
      }
    } catch (error: any) {
      console.error('❌ Erro ao salvar presença:', error);
      showError(`Erro ao salvar presença: ${error.message || 'Erro desconhecido'}`);
      throw error; // Re-throw para que o componente possa tratar
    }
  };

  // Rendering logic
  if (currentView === 'login') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-white">
        <div className="w-full max-w-md">
          <LoginForm onSuccess={handleLoginSuccess} />
        </div>
      </div>
    );
  }

  // Derive Data from database
  const selectedTrip = trips.find(t => t.id === selectedTripId);
  const tripTours = selectedTripId ? tours.filter(t => t.tripId === selectedTripId) : [];
  const tripGroups = selectedTripId ? groups.filter(g => g.tripId === selectedTripId) : [];

  return (
    <Layout 
      onLogout={handleLogout} 
      onNavigateHome={handleNavigateHome}
      onNavigateTours={handleNavigateTours}
      onNavigateGroups={handleNavigateGroups}
      onNavigateFinancial={handleNavigateFinancial}
      onNavigateAgenda={handleNavigateAgenda}
      onNavigateCityGuide={handleNavigateCityGuide}
      onNavigateDestinosGuide={handleNavigateDestinosGuide}
      onNavigateMyTrip={handleNavigateMyTrip}
      userRole={userRole}
      userName={userRole === 'user' ? currentUserGroup?.leaderName : 'Admin User'}
      userEmail={userRole === 'user' ? currentUserGroup?.leaderEmail : 'admin@travel.com'}
    >
      {currentView === 'dashboard' && userRole === 'admin' && (
        <div className="animate-in fade-in duration-500">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Viagens</h1>
              <p className="text-text-secondary mt-1">Gerencie suas viagens e excursões</p>
            </div>
            <Button 
              className="hidden sm:flex h-10 px-4 text-sm"
              onClick={handleNewTripClick}
            >
              <Plus size={18} className="mr-2" />
              Nova Viagem
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-text-secondary">Carregando viagens...</div>
          ) : trips.length === 0 ? (
            <div className="text-center py-12 text-text-secondary bg-white rounded-custom border border-border border-dashed">
              <p className="mb-2">Nenhuma viagem encontrada.</p>
              <p className="text-sm text-text-disabled">Crie sua primeira viagem!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map(trip => (
                <TripCard 
                  key={trip.id} 
                  trip={trip} 
                  onClick={handleTripClick} 
                />
              ))}
            </div>
          )}

          {/* Floating Action Button for Mobile */}
          <button 
            onClick={handleNewTripClick}
            className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-hover active:scale-95 transition-all z-20"
          >
            <Plus size={24} />
          </button>
        </div>
      )}

      {currentView === 'all-tours' && userRole === 'admin' && (
        <ToursList 
          onEdit={handleEditTour}
          onViewGroup={handleViewGroup}
          onViewTourGroups={handleViewTourGroups}
          onDelete={handleDeleteTour}
          onAddTour={handleNewTourClick}
          tours={tours}
          trips={trips}
        />
      )}

      {currentView === 'all-groups' && userRole === 'admin' && (
        <GroupsList 
          onEdit={handleEditGroup}
          onDelete={handleDeleteGroup}
          onAddGroup={handleNewGroupClick}
        />
      )}

      {currentView === 'trip-details' && (() => {
        // Se for usuário e não tiver selectedTrip ainda, mostrar loading ou mensagem
        if (userRole === 'user' && !selectedTrip && selectedTripId) {
          return (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <p className="text-text-secondary">Carregando informações da viagem...</p>
              </div>
            </div>
          );
        }
        
        // Se não tiver selectedTrip, não renderizar
        if (!selectedTrip) {
          return null;
        }
        
        return (
          <TripDetails 
            trip={selectedTrip}
            tours={tripTours}
            groups={tripGroups}
            onBack={handleNavigateHome}
            onAddTour={handleNewTourClick}
            onAddGroup={handleNewGroupClick}
            onEditTour={userRole === 'admin' ? handleEditTour : undefined}
            initialTab={tripDetailsInitialTab}
            userRole={userRole} // Pass Role
            userGroup={currentUserGroup || undefined} // Pass Group data
            onSaveAttendance={handleSaveAttendance} // Pass granular handler
            onViewTourAttendance={handleViewTourAttendance}
            onViewTourDetail={handleViewTourDetail}
            selectedTourId={selectedTourForGroups} // Pass selected tour ID for filtering groups
          />
        );
      })()}

      {/* FIXED: Robust check for Tour Attendance View */}
      {currentView === 'tour-detail' && selectedTourForDetail && (() => {
        const trip = trips.find(t => t.id === selectedTourForDetail.tripId);
        // Filtrar grupos da mesma viagem do passeio
        let tourGroups = groups.filter(g => g.tripId === selectedTourForDetail.tripId);
        
        // Se for usuário, garantir que o currentUserGroup esteja incluído se pertencer à mesma viagem
        if (userRole === 'user' && currentUserGroup && currentUserGroup.tripId === selectedTourForDetail.tripId) {
          // Verificar se o grupo do usuário já está na lista
          const userGroupInList = tourGroups.find(g => g.id === currentUserGroup.id);
          if (!userGroupInList) {
            // Adicionar o grupo do usuário à lista se não estiver presente
            tourGroups = [...tourGroups, currentUserGroup];
            console.log('✅ App.tsx - Adicionando currentUserGroup à lista de grupos');
          } else {
            // Se já está na lista, garantir que está atualizado com os dados mais recentes
            tourGroups = tourGroups.map(g => 
              g.id === currentUserGroup.id ? currentUserGroup : g
            );
            console.log('✅ App.tsx - Atualizando currentUserGroup na lista');
          }
        }
        
        console.log('📋 App.tsx - Renderizando TourDetailPage:', {
          tourId: selectedTourForDetail.id,
          tourName: selectedTourForDetail.name,
          tripId: selectedTourForDetail.tripId,
          totalGroups: groups.length,
          tourGroups: tourGroups.length,
          userRole,
          hasCurrentUserGroup: !!currentUserGroup,
          currentUserGroupId: currentUserGroup?.id,
          currentUserGroupInList: tourGroups.some(g => g.id === currentUserGroup?.id),
          currentUserGroupAttendance: currentUserGroup?.tourAttendance?.[selectedTourForDetail.id] ? {
            members: (currentUserGroup.tourAttendance[selectedTourForDetail.id] as any)?.members || [],
            selectedPriceKey: (currentUserGroup.tourAttendance[selectedTourForDetail.id] as any)?.selectedPriceKey,
            customDate: (currentUserGroup.tourAttendance[selectedTourForDetail.id] as any)?.customDate
          } : null
        });
        return (
          <TourDetailPage
            tour={selectedTourForDetail}
            trip={trip}
            userRole={userRole}
            userGroup={userRole === 'user' ? currentUserGroup : undefined}
            groups={tourGroups}
            onBack={handleBackFromTourDetail}
            onConfirmAttendance={userRole === 'user' ? handleSaveAttendance : undefined}
          />
        );
      })()}

      {currentView === 'tour-attendance' && selectedTourForAttendance && (() => {
        // Garantir que temos a viagem correta
        const tourTrip = selectedTrip || trips.find(t => t.id === selectedTourForAttendance.tripId);
        // Filtrar grupos pela viagem do tour
        const tourGroups = groups.filter(g => g.tripId === selectedTourForAttendance.tripId);
        
        return (
          <TourAttendanceView 
            tour={selectedTourForAttendance}
            trip={tourTrip!}
            groups={tourGroups}
            onBack={() => window.history.back()}
          />
        );
      })()}

      {(currentView === 'new-tour' || currentView === 'edit-tour') && userRole === 'admin' && (
        <NewTourForm 
          trip={selectedTrip || undefined}
          initialData={editingTour}
          onSave={handleSaveTour}
          onCancel={handleCancelNewTour}
        />
      )}

      {(currentView === 'new-group' || currentView === 'edit-group') && userRole === 'admin' && (
        <NewGroupForm 
          trip={selectedTrip}
          initialData={editingGroup}
          onSave={handleSaveGroup}
          onCancel={handleCancelNewGroup}
        />
      )}

      {currentView === 'new-trip' && userRole === 'admin' && (
        <NewTripForm 
          onSave={handleSaveTrip}
          onCancel={handleCancelNewTrip}
        />
      )}

      {currentView === 'financial' && userRole === 'admin' && (
        <FinancialView />
      )}

      {currentView === 'agenda' && userRole === 'user' && currentUserGroup && (
        <TourAgenda 
          tours={tours}
          trips={trips}
          userGroup={currentUserGroup}
          onViewTourDetail={handleViewTourDetail}
          onAddCustomTour={handleNavigateCustomTours}
        />
      )}

      {currentView === 'city-guide' && (
        <CityGuide />
      )}

      {currentView === 'destinos-guide' && (
        <DestinosGuide />
      )}

      {currentView === 'my-trip' && userRole === 'user' && currentUserGroup && (
        <MyTripPage 
          userGroup={currentUserGroup}
          onBack={() => setCurrentView('dashboard')}
        />
      )}

      {currentView === 'custom-tours' && userRole === 'user' && currentUserGroup && (
        <UserCustomToursPage 
          userGroup={currentUserGroup}
          onBack={() => window.history.back()}
        />
      )}

      {/* Modal de Alteração de Senha (Primeiro Acesso) - Usuário */}
      {userRole === 'user' && currentUserGroup && (
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          group={currentUserGroup}
          onSuccess={handlePasswordChangeSuccess}
          onCancel={undefined} // Não permite cancelar no primeiro acesso
        />
      )}

      {/* Modal de Alteração de Senha (Primeiro Acesso) - Admin */}
      {userRole === 'admin' && currentAdminEmail && (
        <ChangePasswordModalAdmin
          isOpen={showChangePasswordModalAdmin}
          adminEmail={currentAdminEmail}
          currentPasswordHash={currentAdminPasswordHash}
          onSuccess={handlePasswordChangeSuccessAdmin}
          onCancel={undefined} // Não permite cancelar no primeiro acesso
        />
      )}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;