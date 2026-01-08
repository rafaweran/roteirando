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
import FinancialView from './components/FinancialView';
import ChangePasswordModal from './components/ChangePasswordModal';
import { Trip, Tour, UserRole, Group } from './types';
import { tripsApi, toursApi, groupsApi } from './lib/database';
import { Plus } from 'lucide-react';
import Button from './components/Button';

type View = 'login' | 'dashboard' | 'trip-details' | 'new-tour' | 'edit-tour' | 'new-trip' | 'new-group' | 'all-tours' | 'all-groups' | 'tour-attendance' | 'financial';

const App: React.FC = () => {
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
  const [selectedTourForAttendance, setSelectedTourForAttendance] = useState<Tour | null>(null);
  const [tripDetailsInitialTab, setTripDetailsInitialTab] = useState<'tours' | 'groups'>('tours');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

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

  // Load all data when user logs in
  useEffect(() => {
    if (currentView !== 'login' && userRole === 'admin') {
      console.log('🔄 Carregando dados do banco...');
      loadTrips();
      loadTours();
      loadGroups();
    }
  }, [currentView, userRole]);

  // Debug: Log view changes
  useEffect(() => {
    console.log('📍 View atual:', currentView, 'UserRole:', userRole);
  }, [currentView, userRole]);

  const handleLoginSuccess = async (role: UserRole, group?: Group) => {
    setUserRole(role);
    if (role === 'user' && group) {
      setCurrentUserGroup(group);
      setSelectedTripId(group.tripId);
      
      // Recarregar grupo do banco para ter dados atualizados
      try {
        const updatedGroup = await groupsApi.getById(group.id);
        if (updatedGroup) {
          setCurrentUserGroup(updatedGroup);
          
          // Verificar se precisa alterar senha (primeiro acesso)
          if (!updatedGroup.passwordChanged) {
            console.log('🔑 Primeiro acesso detectado - mostrando modal de alteração de senha');
            setShowChangePasswordModal(true);
          }
        }
      } catch (err) {
        console.error('Erro ao recarregar grupo:', err);
      }
      
      // Carregar dados da viagem do usuário
      await loadTrips();
      await loadTours();
      await loadGroups();
      setCurrentView('trip-details'); // User goes straight to their trip
    } else {
      // Admin: carregar todos os dados
      await loadTrips();
      await loadTours();
      await loadGroups();
      setCurrentView('dashboard'); // Admin goes to dashboard
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
    setCurrentView('login');
    setSelectedTripId(null);
    setUserRole('admin');
    setCurrentUserGroup(null);
  };

  const handleTripClick = (trip: Trip) => {
    setSelectedTripId(trip.id);
    setTripDetailsInitialTab('tours');
    setCurrentView('trip-details');
  };

  const handleNavigateHome = () => {
    if (userRole === 'user') {
       // For user, "Home" is their Trip Details
       if (currentUserGroup) setSelectedTripId(currentUserGroup.tripId);
       setCurrentView('trip-details');
    } else {
       setCurrentView('dashboard');
       setSelectedTripId(null);
    }
  };

  const handleNavigateTours = () => {
    setCurrentView('all-tours');
    setSelectedTripId(null);
  };

  const handleNavigateGroups = () => {
    setCurrentView('all-groups');
    setSelectedTripId(null);
  };

  const handleNavigateFinancial = () => {
    setCurrentView('financial');
    setSelectedTripId(null);
  };

  const handleNewTourClick = () => {
    console.log('🔄 handleNewTourClick: Criando novo passeio...');
    setEditingTour(null);
    setSelectedTripId(null); // Limpar seleção de viagem para permitir seleção no formulário
    setCurrentView('new-tour');
    console.log('✅ handleNewTourClick: View alterada para new-tour');
  };

  const handleEditTour = (tour: Tour) => {
    setEditingTour(tour);
    setSelectedTripId(tour.tripId); 
    setCurrentView('edit-tour');
  };

  const handleViewTourAttendance = (tour: Tour) => {
    setSelectedTourForAttendance(tour);
    // Ensure trip ID is set correctly for context
    setSelectedTripId(tour.tripId);
    setCurrentView('tour-attendance');
  };

  const handleDeleteTour = (tourId: string) => {
    console.log(`Deleted tour with ID: ${tourId}`);
  };
  
  const handleDeleteGroup = (groupId: string) => {
    console.log(`Deleted group with ID: ${groupId}`);
  };

  const handleViewGroup = (tripId: string) => {
    setSelectedTripId(tripId);
    setTripDetailsInitialTab('groups');
    setCurrentView('trip-details');
  };

  const handleNewGroupClick = () => {
    setCurrentView('new-group');
  };

  const handleNewTripClick = () => {
    setCurrentView('new-trip');
  };

  const handleSaveTour = async (tourData: any) => {
    try {
      setLoading(true);
      if (editingTour) {
        await toursApi.update(editingTour.id, tourData);
        alert('✅ Passeio atualizado com sucesso!');
      } else {
        await toursApi.create(tourData);
        alert('✅ Seu passeio foi criado com sucesso!');
      }
      // Recarregar passeios após salvar
      await loadTours();
      if (selectedTripId) {
        setTripDetailsInitialTab('tours');
        setCurrentView('trip-details');
      } else {
        setCurrentView('all-tours');
      }
      setEditingTour(null);
    } catch (err: any) {
      console.error('Erro ao salvar passeio:', err);
      alert(`❌ Erro ao salvar passeio: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelNewTour = () => {
    if (selectedTripId) {
      setCurrentView('trip-details');
    } else {
      setCurrentView('all-tours');
    }
    setEditingTour(null);
  };

  const handleSaveGroup = async (groupData: any) => {
    try {
      setLoading(true);
      
      // Garantir que password_changed seja false para novos grupos
      const groupToSave = {
        ...groupData,
        membersCount: parseInt(groupData.totalPeople) || groupData.membersCount || 0,
        password_changed: false, // Primeiro acesso, precisa alterar senha
      };
      
      await groupsApi.create(groupToSave);
      
      // Recarregar grupos após salvar
      await loadGroups();
      
      alert('✅ Grupo criado com sucesso! O responsável receberá as credenciais de acesso.');
      
      if (selectedTripId) {
        setTripDetailsInitialTab('groups');
        setCurrentView('trip-details');
      } else {
        setCurrentView('all-groups');
      }
    } catch (err: any) {
      console.error('Erro ao salvar grupo:', err);
      alert(`❌ Erro ao salvar grupo: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelNewGroup = () => {
    if (selectedTripId) {
        setCurrentView('trip-details');
    } else {
        setCurrentView('all-groups');
    }
  };

  const handleSaveTrip = async (tripData: any) => {
    try {
      setLoading(true);
      console.log('🔄 handleSaveTrip: Iniciando salvamento...', tripData);
      
      // Validação básica
      if (!tripData.name || !tripData.destination || !tripData.startDate || !tripData.endDate) {
        alert('Por favor, preencha todos os campos obrigatórios.');
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
      setCurrentView('dashboard');
      
      // Mostrar feedback de sucesso
      alert('Viagem criada com sucesso!');
      
    } catch (err: any) {
      console.error('❌ Erro ao salvar viagem:', err);
      const errorMessage = err.message || err.error?.message || 'Erro desconhecido ao salvar viagem';
      alert(`Erro ao salvar viagem: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelNewTrip = () => {
    setCurrentView('dashboard');
  };

  // User Selection Logic (Granular Attendance)
  const handleSaveAttendance = async (tourId: string, members: string[], cancelReason?: string) => {
    if (userRole !== 'user' || !currentUserGroup) return;

    try {
      // Salvar no banco de dados
      const { tourAttendanceApi } = await import('./lib/database');
      await tourAttendanceApi.saveAttendance(currentUserGroup.id, tourId, members);

      // Log do motivo se for cancelamento
      if (members.length === 0 && cancelReason) {
        console.log(`🚫 Cancelamento do passeio ${tourId} pelo grupo ${currentUserGroup.name}`);
        console.log(`📝 Motivo: ${cancelReason}`);
        // TODO: Em produção, salvar o motivo em uma tabela separada ou adicionar coluna cancellation_reason na tabela tour_attendance
      }

      // Create a new attendance record
      const updatedAttendance = {
          ...currentUserGroup.tourAttendance,
          [tourId]: members
      };

      // If member list is empty, we can clean up the key (optional)
      if (members.length === 0) {
          delete updatedAttendance[tourId];
      }

      // Update local state
      setCurrentUserGroup({
          ...currentUserGroup,
          tourAttendance: updatedAttendance
      });
      
      if (members.length > 0) {
        console.log(`✅ User ${currentUserGroup.leaderName} updated attendance for tour ${tourId}. Members going:`, members);
      }
      
      // Recarregar grupos para ter dados atualizados
      await loadGroups();
    } catch (error: any) {
      console.error('❌ Erro ao salvar presença:', error);
      alert(`Erro ao salvar presença: ${error.message || 'Erro desconhecido'}`);
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
          onDelete={handleDeleteTour}
          onAddTour={handleNewTourClick}
        />
      )}

      {currentView === 'all-groups' && userRole === 'admin' && (
        <GroupsList 
          onDelete={handleDeleteGroup}
          onAddGroup={handleNewGroupClick}
        />
      )}

      {currentView === 'trip-details' && selectedTrip && (
        <TripDetails 
          trip={selectedTrip}
          tours={tripTours}
          groups={tripGroups}
          onBack={handleNavigateHome}
          onAddTour={handleNewTourClick}
          onAddGroup={handleNewGroupClick}
          initialTab={tripDetailsInitialTab}
          userRole={userRole} // Pass Role
          userGroup={currentUserGroup || undefined} // Pass Group data
          onSaveAttendance={handleSaveAttendance} // Pass granular handler
          onViewTourAttendance={handleViewTourAttendance} // New handler for page navigation
        />
      )}

      {/* FIXED: Robust check for Tour Attendance View */}
      {currentView === 'tour-attendance' && selectedTourForAttendance && (
        <TourAttendanceView 
          tour={selectedTourForAttendance}
          // Fallback to finding trip if selectedTrip state isn't synced yet
          trip={selectedTrip || trips.find(t => t.id === selectedTourForAttendance.tripId)!}
          groups={selectedTripId ? tripGroups : groups.filter(g => g.tripId === selectedTourForAttendance.tripId)}
          onBack={() => setCurrentView('trip-details')}
        />
      )}

      {(currentView === 'new-tour' || currentView === 'edit-tour') && userRole === 'admin' && (
        <NewTourForm 
          trip={selectedTrip || undefined}
          initialData={editingTour}
          onSave={handleSaveTour}
          onCancel={handleCancelNewTour}
        />
      )}

      {currentView === 'new-group' && userRole === 'admin' && (
        <NewGroupForm 
          trip={selectedTrip}
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

      {/* Modal de Alteração de Senha (Primeiro Acesso) */}
      {userRole === 'user' && currentUserGroup && (
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          group={currentUserGroup}
          onSuccess={handlePasswordChangeSuccess}
          onCancel={undefined} // Não permite cancelar no primeiro acesso
        />
      )}
    </Layout>
  );
};

export default App;