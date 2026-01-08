import React, { useState } from 'react';
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
import { Trip, Tour, UserRole, Group } from './types';
import { MOCK_TRIPS, MOCK_TOURS, MOCK_GROUPS } from './data';
import { Plus } from 'lucide-react';
import Button from './components/Button';

type View = 'login' | 'dashboard' | 'trip-details' | 'new-tour' | 'edit-tour' | 'new-trip' | 'new-group' | 'all-tours' | 'all-groups' | 'tour-attendance';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('login');
  
  // User Session State
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [currentUserGroup, setCurrentUserGroup] = useState<Group | null>(null);

  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [selectedTourForAttendance, setSelectedTourForAttendance] = useState<Tour | null>(null);
  const [tripDetailsInitialTab, setTripDetailsInitialTab] = useState<'tours' | 'groups'>('tours');

  const handleLoginSuccess = (role: UserRole, group?: Group) => {
    setUserRole(role);
    if (role === 'user' && group) {
      setCurrentUserGroup(group);
      setSelectedTripId(group.tripId);
      setCurrentView('trip-details'); // User goes straight to their trip
    } else {
      setCurrentView('dashboard'); // Admin goes to dashboard
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

  const handleNewTourClick = () => {
    setEditingTour(null);
    setCurrentView('new-tour');
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

  const handleSaveTour = (tourData: any) => {
    console.log('Saved/Updated tour:', tourData);
    if (selectedTripId) {
      setTripDetailsInitialTab('tours');
      setCurrentView('trip-details');
    } else {
      setCurrentView('all-tours');
    }
    setEditingTour(null);
  };

  const handleCancelNewTour = () => {
    if (selectedTripId) {
      setCurrentView('trip-details');
    } else {
      setCurrentView('all-tours');
    }
    setEditingTour(null);
  };

  const handleSaveGroup = (groupData: any) => {
    console.log('Saved group:', groupData);
    if (selectedTripId) {
        setTripDetailsInitialTab('groups');
        setCurrentView('trip-details');
    } else {
        setCurrentView('all-groups');
    }
  };

  const handleCancelNewGroup = () => {
    if (selectedTripId) {
        setCurrentView('trip-details');
    } else {
        setCurrentView('all-groups');
    }
  };

  const handleSaveTrip = (tripData: any) => {
    console.log('Saved trip:', tripData);
    setCurrentView('dashboard');
  };

  const handleCancelNewTrip = () => {
    setCurrentView('dashboard');
  };

  // User Selection Logic (Granular Attendance)
  const handleSaveAttendance = (tourId: string, members: string[]) => {
    if (userRole !== 'user' || !currentUserGroup) return;

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
    
    console.log(`User ${currentUserGroup.leaderName} updated attendance for tour ${tourId}. Members going:`, members);
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

  // Derive Data
  const selectedTrip = MOCK_TRIPS.find(t => t.id === selectedTripId);
  const tripTours = selectedTripId ? MOCK_TOURS.filter(t => t.tripId === selectedTripId) : [];
  const tripGroups = selectedTripId ? MOCK_GROUPS.filter(g => g.tripId === selectedTripId) : [];

  return (
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_TRIPS.map(trip => (
              <TripCard 
                key={trip.id} 
                trip={trip} 
                onClick={handleTripClick} 
              />
            ))}
          </div>

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
          trip={selectedTrip || MOCK_TRIPS.find(t => t.id === selectedTourForAttendance.tripId)!}
          groups={selectedTripId ? tripGroups : MOCK_GROUPS.filter(g => g.tripId === selectedTourForAttendance.tripId)}
          onBack={() => setCurrentView('trip-details')}
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
  );
};

export default App;