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
import Toast from './components/Toast';
import { Trip, Tour, UserRole, Group } from './types';
import { tripsApi, toursApi, groupsApi, tourAttendanceApi } from './lib/database';
import { hashPassword } from './lib/password';
import { sendCredentialsEmail } from './lib/email';
import { createAuthUser } from './lib/auth';
import ChangePasswordModal from './components/ChangePasswordModal';
import { Plus } from 'lucide-react';
import Button from './components/Button';

type View = 'login' | 'dashboard' | 'trip-details' | 'new-tour' | 'edit-tour' | 'new-trip' | 'new-group' | 'all-tours' | 'all-groups';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('login');
  
  // User Session State
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [currentUserGroup, setCurrentUserGroup] = useState<Group | null>(null);

  // Data State
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [groupNeedingPasswordChange, setGroupNeedingPasswordChange] = useState<Group | null>(null);

  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [tripDetailsInitialTab, setTripDetailsInitialTab] = useState<'tours' | 'groups'>('tours');

  // Load data functions
  const loadTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tripsApi.getAll();
      setTrips(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar viagens');
      console.error('Error loading trips:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTours = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await toursApi.getAll();
      setTours(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar tours');
      console.error('Error loading tours:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await groupsApi.getAll();
      setGroups(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar grupos');
      console.error('Error loading groups:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load data when view changes
  useEffect(() => {
    if (currentView === 'dashboard' || currentView === 'all-tours' || currentView === 'all-groups' || currentView === 'trip-details') {
      loadTrips();
      loadTours();
      loadGroups();
    }
  }, [currentView]);

  // Reload trip-specific data when selectedTripId changes
  useEffect(() => {
    if (selectedTripId && (currentView === 'trip-details' || currentView === 'edit-tour' || currentView === 'new-tour' || currentView === 'new-group')) {
      const loadTripData = async () => {
        try {
          const [tripTours, tripGroups] = await Promise.all([
            toursApi.getByTripId(selectedTripId),
            groupsApi.getByTripId(selectedTripId),
          ]);
          setTours(prev => {
            const filtered = prev.filter(t => t.tripId !== selectedTripId);
            return [...filtered, ...tripTours];
          });
          setGroups(prev => {
            const filtered = prev.filter(g => g.tripId !== selectedTripId);
            return [...filtered, ...tripGroups];
          });
        } catch (err: any) {
          console.error('Error loading trip data:', err);
        }
      };
      loadTripData();
    }
  }, [selectedTripId, currentView]);

  const handleLoginSuccess = (role: UserRole, group?: Group) => {
    console.log('='.repeat(60));
    console.log('🎯 handleLoginSuccess CHAMADO');
    console.log('='.repeat(60));
    console.log('📋 Parâmetros recebidos:', { 
      role, 
      groupId: group?.id, 
      groupName: group?.name,
      hasGroup: !!group
    });
    
    setUserRole(role);
    
    if (role === 'user' && group) {
      console.log('✅ É um usuário (não admin)');
      console.log('📦 Grupo completo recebido:', JSON.stringify(group, null, 2));
      
      setCurrentUserGroup(group);
      setSelectedTripId(group.tripId);
      
      // Debug: verificar campos do grupo
      console.log('🔍 Análise detalhada do campo passwordChanged:');
      console.log('   - Valor bruto:', group.passwordChanged);
      console.log('   - Tipo:', typeof group.passwordChanged);
      console.log('   - É true?', group.passwordChanged === true);
      console.log('   - É false?', group.passwordChanged === false);
      console.log('   - É undefined?', group.passwordChanged === undefined);
      console.log('   - É null?', group.passwordChanged === null);
      console.log('   - Truthy?', !!group.passwordChanged);
      console.log('   - Falsy?', !group.passwordChanged);
      
      // Verificar se precisa alterar senha (primeiro acesso)
      // passwordChanged será true apenas se explicitamente definido como true no banco
      // false, undefined, null = primeiro acesso
      const needsPasswordChange = group.passwordChanged !== true;
      
      console.log('🔑 VERIFICAÇÃO FINAL:');
      console.log('   - needsPasswordChange:', needsPasswordChange);
      console.log('   - Lógica usada: passwordChanged !== true');
      console.log('   - Resultado:', needsPasswordChange ? 'SIM - PRECISA ALTERAR SENHA' : 'NÃO - JÁ ALTEROU SENHA');
      console.log('='.repeat(60));
      
      if (needsPasswordChange) {
        console.log('✅ DEFININDO MODAL PARA MOSTRAR');
        console.log('='.repeat(60));
        console.log('📝 Definindo estados agora:');
        console.log('   - groupNeedingPasswordChange:', group.id);
        console.log('   - showChangePasswordModal: true');
        console.log('   - currentView: mantendo como', currentView, '(não mudar ainda)');
        
        // Definir estado imediatamente
        setGroupNeedingPasswordChange(group);
        setShowChangePasswordModal(true);
        
        console.log('✅ Estados definidos! Modal DEVE aparecer agora!');
        console.log('⚠️ Aguardando próximo render para verificar se modal aparece...');
        console.log('='.repeat(60));
        
        // Não mudar a view - manter na tela de login para mostrar o modal
        // O modal será renderizado sobre a tela de login
      } else {
        console.log('✅ Senha já foi alterada (passwordChanged = true)');
        console.log('📍 Redirecionando para viagem...');
        console.log('='.repeat(60));
        setCurrentView('trip-details'); // User goes straight to their trip
      }
    } else {
      console.log('ℹ️ É admin ou não há grupo - redirecionando para dashboard');
      setCurrentView('dashboard'); // Admin goes to dashboard
    }
  };

  const handlePasswordChanged = async () => {
    console.log('='.repeat(60));
    console.log('✅ handlePasswordChanged CHAMADO - Senha alterada!');
    console.log('='.repeat(60));
    
    if (currentUserGroup) {
      console.log('🔄 Recarregando grupo após alteração de senha...');
      // Recarregar o grupo para pegar os dados atualizados
      const updatedGroup = await groupsApi.getById(currentUserGroup.id);
      if (updatedGroup) {
        console.log('✅ Grupo recarregado:', {
          id: updatedGroup.id,
          passwordChanged: updatedGroup.passwordChanged,
        });
        setCurrentUserGroup(updatedGroup);
      }
    }
    
    console.log('🔄 Fechando modal e redirecionando...');
    setShowChangePasswordModal(false);
    setGroupNeedingPasswordChange(null);
    setCurrentView('trip-details'); // Agora pode ir para a tela de viagem
    console.log('✅ Redirecionado para trip-details');
    console.log('='.repeat(60));
  };

  const handleLogout = () => {
    setCurrentView('login');
    setSelectedTripId(null);
    setUserRole('admin');
    setCurrentUserGroup(null);
    setShowChangePasswordModal(false);
    setGroupNeedingPasswordChange(null);
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

  const handleNewTourClick = () => {
    setEditingTour(null);
    setCurrentView('new-tour');
  };

  const handleEditTour = (tour: Tour) => {
    setEditingTour(tour);
    setSelectedTripId(tour.tripId); 
    setCurrentView('edit-tour');
  };

  const handleDeleteTour = async (tourId: string) => {
    if (!confirm('Tem certeza que deseja excluir este tour?')) return;
    try {
      setLoading(true);
      setError(null);
      await toursApi.delete(tourId);
      await loadTours();
      // If we're in trip details, reload the data
      if (selectedTripId) {
        const tripTours = await toursApi.getByTripId(selectedTripId);
        setTours(prev => {
          const filtered = prev.filter(t => t.id !== tourId);
          return [...filtered, ...tripTours].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        });
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir tour');
      console.error('Error deleting tour:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Tem certeza que deseja excluir este grupo?')) return;
    try {
      setLoading(true);
      setError(null);
      await groupsApi.delete(groupId);
      await loadGroups();
      // If we're in trip details, reload the data
      if (selectedTripId) {
        const tripGroups = await groupsApi.getByTripId(selectedTripId);
        setGroups(prev => {
          const filtered = prev.filter(g => g.id !== groupId);
          return [...filtered, ...tripGroups].filter((v, i, a) => a.findIndex(g => g.id === v.id) === i);
        });
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir grupo');
      console.error('Error deleting group:', err);
    } finally {
      setLoading(false);
    }
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
    console.log('🚀 ========== INÍCIO handleSaveTour ==========');
    console.log('📥 Dados recebidos:', {
      isEdit: !!editingTour,
      tourId: editingTour?.id,
      tourName: tourData?.name,
      tourDate: tourData?.date,
      tourTime: tourData?.time,
      tourPrice: tourData?.price,
      hasImage: !!tourData?.imageUrl,
      imageUrlLength: tourData?.imageUrl?.length || 0,
      hasDescription: !!tourData?.description,
      descriptionLength: tourData?.description?.length || 0,
      linksCount: tourData?.links?.length || 0,
      tripId: tourData?.tripId,
    });
    
    try {
      console.log('⏳ Definindo loading = true');
      setLoading(true);
      console.log('✅ Loading definido');
      
      console.log('🧹 Limpando erro anterior');
      setError(null);
      console.log('✅ Erro limpo');
      
      // Validate required fields
      console.log('✅ Validando campos obrigatórios...');
      if (!tourData.name || !tourData.name.trim()) {
        console.error('❌ Validação falhou: Nome vazio');
        throw new Error('Nome do passeio é obrigatório');
      }
      if (!tourData.date) {
        console.error('❌ Validação falhou: Data vazia');
        throw new Error('Data do passeio é obrigatória');
      }
      console.log('✅ Validação passou');
      
      if (editingTour) {
        // Update existing tour
        console.log('📝 ========== MODO EDIÇÃO ==========');
        console.log('🔄 Atualizando passeio existente...');
        console.log('📋 ID do passeio:', editingTour.id);
        console.log('📋 Dados para atualizar:', tourData);
        
        try {
          const result = await toursApi.update(editingTour.id, tourData);
          console.log('✅ Passeio atualizado com sucesso:', result);
          console.log('📢 Definindo toast de sucesso...');
          setToast({ message: 'Passeio atualizado com sucesso!', type: 'success' });
          console.log('✅ Toast definido');
        } catch (updateError: any) {
          console.error('❌ Erro ao atualizar passeio:', updateError);
          throw updateError;
        }
      } else {
        // Create new tour
        console.log('➕ ========== MODO CRIAÇÃO ==========');
        console.log('🆕 Criando novo passeio...');
        console.log('📋 Dados para criar:', {
          tripId: tourData.tripId,
          name: tourData.name,
          date: tourData.date,
          time: tourData.time,
          price: tourData.price,
          description: tourData.description?.substring(0, 50) + '...',
          imageUrl: tourData.imageUrl ? `[base64: ${tourData.imageUrl.length} chars]` : 'null',
          links: tourData.links,
        });
        
        try {
          console.log('📞 Chamando toursApi.create...');
          const result = await toursApi.create(tourData);
          console.log('✅ Passeio criado com sucesso:', result);
          console.log('📢 Definindo toast de sucesso...');
          setToast({ message: 'Passeio criado com sucesso!', type: 'success' });
          console.log('✅ Toast definido');
        } catch (createError: any) {
          console.error('❌ ========== ERRO ao criar passeio ==========');
          console.error('Erro completo:', createError);
          console.error('Mensagem:', createError?.message);
          console.error('Código:', createError?.code);
          console.error('Detalhes:', createError?.details);
          console.error('Hint:', createError?.hint);
          console.error('Stack:', createError?.stack);
          console.error('==============================================');
          throw createError;
        }
      }
      
      console.log('🔄 Recarregando lista de passeios...');
      try {
        await loadTours();
        console.log('✅ Lista de passeios recarregada');
      } catch (loadError: any) {
        console.error('⚠️ Erro ao recarregar passeios (não crítico):', loadError);
        // Não bloquear o fluxo se o reload falhar
      }
      
      // Wait a bit to show the success message before navigating
      console.log('⏱️ Aguardando 1.5s antes de navegar...');
      setTimeout(() => {
        try {
          console.log('🧭 ========== INICIANDO NAVEGAÇÃO ==========');
          console.log('📍 selectedTripId:', selectedTripId);
          
          if (selectedTripId) {
            console.log('📌 Navegando para trip-details com tab tours');
            setTripDetailsInitialTab('tours');
            setCurrentView('trip-details');
          } else {
            console.log('📌 Navegando para all-tours');
            setCurrentView('all-tours');
          }
          
          console.log('🧹 Limpando editingTour');
          setEditingTour(null);
          console.log('✅ Navegação concluída');
        } catch (navError: any) {
          console.error('❌ ========== ERRO ao navegar ==========');
          console.error('Erro:', navError);
          console.error('Mensagem:', navError?.message);
          console.error('Stack:', navError?.stack);
          console.error('========================================');
          // Fallback navigation
          console.log('🔄 Navegação de fallback para dashboard');
          setCurrentView('dashboard');
        }
      }, 1500);
    } catch (err: any) {
      console.error('❌ ========== ERRO CAPTURADO em handleSaveTour ==========');
      console.error('Tipo do erro:', typeof err);
      console.error('Erro completo:', err);
      console.error('Mensagem:', err?.message);
      console.error('Código:', err?.code);
      console.error('Detalhes:', err?.details);
      console.error('Hint:', err?.hint);
      console.error('Stack:', err?.stack);
      console.error('String:', err?.toString());
      console.error('========================================================');
      
      const errorMessage = err?.message || err?.toString() || 'Erro ao salvar passeio';
      console.log('📝 Mensagem de erro final:', errorMessage);
      
      console.log('📢 Definindo estado de erro...');
      setError(errorMessage);
      console.log('✅ Estado de erro definido');
      
      console.log('📢 Definindo toast de erro...');
      setToast({ message: errorMessage, type: 'error' });
      console.log('✅ Toast de erro definido');
      
      // Don't navigate on error - let user see the error message
      // Keep the form open so user can fix and retry
      console.log('ℹ️ Mantendo formulário aberto para correção');
    } finally {
      console.log('🏁 ========== FINALLY handleSaveTour ==========');
      console.log('⏳ Definindo loading = false');
      setLoading(false);
      console.log('✅ Loading definido como false');
      console.log('🏁 ========== FIM handleSaveTour ==========');
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
      setError(null);
      
      // Validate required fields
      if (!groupData.leaderEmail || !groupData.leaderEmail.trim()) {
        setError('O e-mail do responsável é obrigatório para fazer login.');
        setLoading(false);
        return;
      }
      
      if (!groupData.initialPassword || groupData.initialPassword.length < 8) {
        setError('A senha inicial deve ter pelo menos 8 caracteres.');
        setLoading(false);
        return;
      }
      
      // Hash da senha inicial definida no formulário
      const hashedPassword = hashPassword(groupData.initialPassword);
      const leaderEmail = groupData.leaderEmail.trim();
      
      // Buscar informações da viagem para o email
      const trip = trips.find(t => t.id === (groupData.tripId || selectedTripId));
      
      // Criar usuário no Supabase Auth
      console.log('🔐 Criando usuário no Supabase Auth...');
      const authResult = await createAuthUser(leaderEmail, groupData.initialPassword, {
        leader_name: groupData.leaderName,
        group_name: groupData.name,
        trip_id: groupData.tripId || selectedTripId,
      });
      
      if (authResult.success) {
        console.log('✅ Usuário criado no Auth:', leaderEmail);
      } else {
        console.warn('⚠️ Não foi possível criar usuário no Auth, mas continuando...', authResult.error);
      }
      
      // Criar grupo com senha hasheada
      await groupsApi.create({
        tripId: groupData.tripId || selectedTripId || '',
        name: groupData.name,
        membersCount: groupData.membersCount || groupData.members?.length || 0,
        members: groupData.members || [],
        leaderName: groupData.leaderName,
        leaderEmail: leaderEmail,
        leaderPassword: hashedPassword,
      });
      
      // Enviar email com credenciais
      const emailSent = await sendCredentialsEmail({
        email: groupData.leaderEmail.trim(),
        password: groupData.initialPassword, // Senha em texto claro para o email
        leaderName: groupData.leaderName,
        groupName: groupData.name,
        tripName: trip?.name || 'Viagem',
      });
      
      if (!emailSent) {
        console.warn('Aviso: Email não foi enviado, mas o grupo foi criado. Senha:', groupData.initialPassword);
      }
      
      await loadGroups();
      
      // Mostrar mensagem de sucesso
      setToast({ 
        message: `Grupo criado com sucesso! Credenciais enviadas para ${groupData.leaderEmail.trim()}`, 
        type: 'success' 
      });
      
      if (selectedTripId) {
        setTripDetailsInitialTab('groups');
        setCurrentView('trip-details');
      } else {
        setCurrentView('all-groups');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar grupo');
      setToast({ message: err.message || 'Erro ao salvar grupo', type: 'error' });
      console.error('Error saving group:', err);
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
      setError(null);
      
      await tripsApi.create({
        name: tripData.name,
        destination: tripData.destination,
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        description: tripData.description,
        status: tripData.status || 'upcoming',
        imageUrl: tripData.imageUrl || '',
        links: tripData.links,
      });
      
      await loadTrips();
      setCurrentView('dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar viagem');
      console.error('Error saving trip:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelNewTrip = () => {
    setCurrentView('dashboard');
  };

  // User Selection Logic (Granular Attendance)
  const handleSaveAttendance = async (tourId: string, members: string[]) => {
    if (userRole !== 'user' || !currentUserGroup) {
      console.warn('⚠️ handleSaveAttendance: userRole não é "user" ou currentUserGroup não existe');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('💾 Salvando presença no App.tsx:', {
        groupId: currentUserGroup.id,
        tourId,
        membersCount: members.length,
        members,
      });
      
      await tourAttendanceApi.saveAttendance(currentUserGroup.id, tourId, members);

      // Update local state
      const updatedAttendance = {
        ...(currentUserGroup.tourAttendance || {}),
        [tourId]: members
      };

      if (members.length === 0) {
        delete updatedAttendance[tourId];
      }

      setCurrentUserGroup({
        ...currentUserGroup,
        tourAttendance: updatedAttendance
      });

      // Reload the group to get fresh data
      try {
        const updatedGroup = await groupsApi.getById(currentUserGroup.id);
        if (updatedGroup) {
          setCurrentUserGroup(updatedGroup);
        }
      } catch (reloadError) {
        console.warn('⚠️ Erro ao recarregar grupo, mas presença foi salva:', reloadError);
        // Não bloquear o fluxo se o reload falhar
      }

      // Mostrar mensagem de sucesso
      setToast({ 
        message: `Presença confirmada para ${members.length} pessoa${members.length !== 1 ? 's' : ''}!`, 
        type: 'success' 
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao salvar participação';
      setError(errorMessage);
      setToast({ message: errorMessage, type: 'error' });
      console.error('❌ Error saving attendance:', err);
      // Não re-lançar o erro para evitar quebrar a aplicação
    } finally {
      setLoading(false);
    }
  };

  // Rendering logic
  if (currentView === 'login') {
    return (
      <>
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-surface">
          <div className="w-full max-w-md">
            <LoginForm onSuccess={handleLoginSuccess} />
          </div>
        </div>
        
        {/* Modal de Alteração de Senha - Renderizar mesmo quando currentView === 'login' */}
        {showChangePasswordModal && groupNeedingPasswordChange && (
          <>
            {/* Overlay escuro para garantir que o modal seja o foco */}
            <div 
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 49,
                pointerEvents: 'auto',
              }}
              onClick={(e) => {
                // Não permitir fechar clicando fora no primeiro acesso
                if (!groupNeedingPasswordChange.passwordChanged) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            />
            <ChangePasswordModal
              isOpen={showChangePasswordModal}
              group={groupNeedingPasswordChange}
              onSuccess={handlePasswordChanged}
            />
          </>
        )}
        
        {/* Debug overlay (apenas em desenvolvimento) - sempre visível para debug */}
        {import.meta.env.DEV && (
          <div style={{
            position: 'fixed',
            top: '10px',
            left: '10px',
            background: 'rgba(0,0,0,0.95)',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            zIndex: 10001,
            fontSize: '11px',
            fontFamily: 'monospace',
            maxWidth: '350px',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '2px solid #5B2D8B',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#a78bfa', fontSize: '12px' }}>
              🐛 DEBUG MODAL - TEMPO REAL (LOGIN VIEW)
            </div>
            
            <div style={{ marginBottom: '6px', padding: '4px', background: showChangePasswordModal ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)', borderRadius: '4px' }}>
              <strong>showChangePasswordModal:</strong> <span style={{ color: showChangePasswordModal ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
                {showChangePasswordModal ? 'TRUE ✅' : 'FALSE ❌'}
              </span>
            </div>
            
            <div style={{ marginBottom: '6px', padding: '4px', background: groupNeedingPasswordChange ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)', borderRadius: '4px' }}>
              <strong>groupNeedingPasswordChange:</strong> <span style={{ color: groupNeedingPasswordChange ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
                {groupNeedingPasswordChange ? `SIM (${groupNeedingPasswordChange.id.slice(0, 8)}...) ✅` : 'NÃO ❌'}
              </span>
            </div>
            
            {groupNeedingPasswordChange && (
              <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', borderTop: '1px solid #666' }}>
                <div style={{ fontSize: '10px', color: '#999', marginBottom: '4px' }}>GRUPO:</div>
                <div style={{ marginBottom: '2px' }}><strong>Nome:</strong> {groupNeedingPasswordChange.name}</div>
                <div style={{ marginBottom: '2px' }}><strong>Email:</strong> {groupNeedingPasswordChange.leaderEmail}</div>
                <div style={{ marginBottom: '2px' }}>
                  <strong>passwordChanged:</strong> <span style={{ color: groupNeedingPasswordChange.passwordChanged ? '#f87171' : '#4ade80', fontWeight: 'bold' }}>
                    {String(groupNeedingPasswordChange.passwordChanged)} ({typeof groupNeedingPasswordChange.passwordChanged})
                  </span>
                </div>
                <div style={{ marginTop: '4px', fontSize: '10px', color: '#999' }}>
                  Precisa alterar? {groupNeedingPasswordChange.passwordChanged !== true ? 'SIM ✅' : 'NÃO ❌'}
                </div>
              </div>
            )}
            
            <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', borderTop: '1px solid #666', fontSize: '10px', color: '#999' }}>
              <div><strong>currentView:</strong> {currentView}</div>
              <div style={{ marginTop: '4px', fontSize: '9px' }}>
                {new Date().toLocaleTimeString()}
              </div>
            </div>
            
            {/* Indicador visual de renderização */}
            <div style={{ 
              marginTop: '8px', 
              padding: '4px', 
              background: (showChangePasswordModal && groupNeedingPasswordChange) ? 'rgba(74, 222, 128, 0.3)' : 'rgba(248, 113, 113, 0.3)', 
              borderRadius: '4px',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '10px',
            }}>
              {(showChangePasswordModal && groupNeedingPasswordChange) ? '✅ MODAL DEVE ESTAR VISÍVEL AGORA!' : '❌ MODAL NÃO DEVE ESTAR VISÍVEL'}
            </div>
          </div>
        )}
      </>
    );
  }

  const selectedTrip = trips.find(t => t.id === selectedTripId) || null;
  const tripTours = selectedTripId ? tours.filter(t => t.tripId === selectedTripId) : [];
  const tripGroups = selectedTripId ? groups.filter(g => g.tripId === selectedTripId) : [];

  return (
    <>
      {/* Toast - Always render to avoid rendering issues */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={true}
          onClose={() => {
            console.log('🔔 Fechando toast');
            setToast(null);
          }}
        />
      )}
      <Layout 
        onLogout={handleLogout} 
        onNavigateHome={handleNavigateHome}
        onNavigateTours={handleNavigateTours}
        onNavigateGroups={handleNavigateGroups}
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

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-text-secondary">Carregando...</div>
          ) : trips.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">Nenhuma viagem encontrada. Crie sua primeira viagem!</div>
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
          tours={tours}
          trips={trips}
          onEdit={handleEditTour}
          onViewGroup={handleViewGroup}
          onDelete={handleDeleteTour}
        />
      )}

      {currentView === 'all-groups' && userRole === 'admin' && (
        <GroupsList 
          groups={groups}
          trips={trips}
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
        />
      )}

      {(currentView === 'new-tour' || currentView === 'edit-tour') && selectedTrip && userRole === 'admin' && (
        <NewTourForm 
          trip={selectedTrip}
          initialData={editingTour}
          onSave={handleSaveTour}
          onCancel={handleCancelNewTour}
        />
      )}

      {currentView === 'new-group' && userRole === 'admin' && (
        <NewGroupForm 
          trip={selectedTrip}
          trips={trips}
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
      </Layout>

      {/* Modal de Alteração de Senha - Renderizado FORA do Layout para garantir visibilidade */}
      {/* Renderizar sempre que showChangePasswordModal for true */}
      {(() => {
        const shouldRender = showChangePasswordModal && groupNeedingPasswordChange;
        console.log('🎨 RENDERIZAÇÃO DO MODAL:', {
          shouldRender,
          showChangePasswordModal,
          hasGroup: !!groupNeedingPasswordChange,
          groupId: groupNeedingPasswordChange?.id,
          timestamp: new Date().toISOString(),
        });
        
        if (shouldRender) {
          return (
            <>
              {/* Overlay escuro para garantir que o modal seja o foco */}
              <div 
                style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  zIndex: 49,
                  pointerEvents: 'auto',
                }}
                onClick={(e) => {
                  // Não permitir fechar clicando fora no primeiro acesso
                  if (!groupNeedingPasswordChange.passwordChanged) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
              />
              <ChangePasswordModal
                isOpen={showChangePasswordModal}
                group={groupNeedingPasswordChange}
                onSuccess={handlePasswordChanged}
              />
            </>
          );
        }
        
        console.log('❌ Modal NÃO será renderizado porque:', {
          showChangePasswordModal: false,
          hasGroup: !groupNeedingPasswordChange,
        });
        return null;
      })()}
      
      {/* Debug overlay (apenas em desenvolvimento) - sempre visível para debug */}
      {import.meta.env.DEV && (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.95)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          zIndex: 10001,
          fontSize: '11px',
          fontFamily: 'monospace',
          maxWidth: '350px',
          maxHeight: '80vh',
          overflow: 'auto',
          border: '2px solid #5B2D8B',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#a78bfa', fontSize: '12px' }}>
            🐛 DEBUG MODAL - TEMPO REAL
          </div>
          
          <div style={{ marginBottom: '6px', padding: '4px', background: showChangePasswordModal ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)', borderRadius: '4px' }}>
            <strong>showChangePasswordModal:</strong> <span style={{ color: showChangePasswordModal ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
              {showChangePasswordModal ? 'TRUE ✅' : 'FALSE ❌'}
            </span>
          </div>
          
          <div style={{ marginBottom: '6px', padding: '4px', background: groupNeedingPasswordChange ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)', borderRadius: '4px' }}>
            <strong>groupNeedingPasswordChange:</strong> <span style={{ color: groupNeedingPasswordChange ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
              {groupNeedingPasswordChange ? `SIM (${groupNeedingPasswordChange.id.slice(0, 8)}...) ✅` : 'NÃO ❌'}
            </span>
          </div>
          
          {groupNeedingPasswordChange && (
            <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', borderTop: '1px solid #666' }}>
              <div style={{ fontSize: '10px', color: '#999', marginBottom: '4px' }}>GRUPO:</div>
              <div style={{ marginBottom: '2px' }}><strong>Nome:</strong> {groupNeedingPasswordChange.name}</div>
              <div style={{ marginBottom: '2px' }}><strong>Email:</strong> {groupNeedingPasswordChange.leaderEmail}</div>
              <div style={{ marginBottom: '2px' }}>
                <strong>passwordChanged:</strong> <span style={{ color: groupNeedingPasswordChange.passwordChanged ? '#f87171' : '#4ade80', fontWeight: 'bold' }}>
                  {String(groupNeedingPasswordChange.passwordChanged)} ({typeof groupNeedingPasswordChange.passwordChanged})
                </span>
              </div>
              <div style={{ marginTop: '4px', fontSize: '10px', color: '#999' }}>
                Precisa alterar? {groupNeedingPasswordChange.passwordChanged !== true ? 'SIM ✅' : 'NÃO ❌'}
              </div>
            </div>
          )}
          
          {currentUserGroup && (
            <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', borderTop: '1px solid #666' }}>
              <div style={{ fontSize: '10px', color: '#999', marginBottom: '4px' }}>CURRENT USER GROUP:</div>
              <div><strong>passwordChanged:</strong> {String(currentUserGroup.passwordChanged)}</div>
            </div>
          )}
          
          <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', borderTop: '1px solid #666', fontSize: '10px', color: '#999' }}>
            <div><strong>currentView:</strong> {currentView}</div>
            <div style={{ marginTop: '4px', fontSize: '9px' }}>
              {new Date().toLocaleTimeString()}
            </div>
          </div>
          
          {/* Indicador visual de renderização */}
          <div style={{ 
            marginTop: '8px', 
            padding: '4px', 
            background: (showChangePasswordModal && groupNeedingPasswordChange) ? 'rgba(74, 222, 128, 0.3)' : 'rgba(248, 113, 113, 0.3)', 
            borderRadius: '4px',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '10px',
          }}>
            {(showChangePasswordModal && groupNeedingPasswordChange) ? '✅ MODAL DEVE ESTAR VISÍVEL' : '❌ MODAL NÃO DEVE ESTAR VISÍVEL'}
          </div>
        </div>
      )}
    </>
  );
};

export default App;