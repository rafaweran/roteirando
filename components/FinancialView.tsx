import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Calendar, Users, Map } from 'lucide-react';
import { tripsApi, toursApi, groupsApi } from '../lib/database';
import { Trip, Tour, Group } from '../types';

const FinancialView: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [tripsData, toursData, groupsData] = await Promise.all([
          tripsApi.getAll(),
          toursApi.getAll(),
          groupsApi.getAll()
        ]);
        setTrips(tripsData);
        setTours(toursData);
        setGroups(groupsData);
      } catch (err: any) {
        console.error('Erro ao carregar dados financeiros:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Calcular estatísticas financeiras
  const calculateFinancials = () => {
    let totalRevenue = 0;
    let totalTours = 0;
    let totalGroups = 0;
    let totalPeople = 0;

    tours.forEach(tour => {
      totalRevenue += tour.price;
      totalTours++;
    });

    groups.forEach(group => {
      totalGroups++;
      totalPeople += group.membersCount + 1; // +1 para o líder
    });

    const averageTourPrice = totalTours > 0 ? totalRevenue / totalTours : 0;
    const revenuePerPerson = totalPeople > 0 ? totalRevenue / totalPeople : 0;

    return {
      totalRevenue,
      totalTours,
      totalGroups,
      totalPeople,
      averageTourPrice,
      revenuePerPerson
    };
  };

  const financials = calculateFinancials();

  if (loading) {
    return (
      <div className="animate-in fade-in duration-500">
        <div className="text-center py-12 text-text-secondary">Carregando dados financeiros...</div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Financeiro</h1>
        <p className="text-text-secondary mt-1">Visão geral financeira das viagens e passeios</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-custom border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <DollarSign size={24} className="text-primary" />
            </div>
            <TrendingUp size={20} className="text-status-success" />
          </div>
          <h3 className="text-sm font-medium text-text-secondary mb-1">Receita Total</h3>
          <p className="text-2xl font-bold text-text-primary">
            R$ {financials.totalRevenue.toFixed(2).replace('.', ',')}
          </p>
        </div>

        <div className="bg-white rounded-custom border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Calendar size={24} className="text-primary" />
            </div>
            <TrendingUp size={20} className="text-status-success" />
          </div>
          <h3 className="text-sm font-medium text-text-secondary mb-1">Total de Passeios</h3>
          <p className="text-2xl font-bold text-text-primary">{financials.totalTours}</p>
        </div>

        <div className="bg-white rounded-custom border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Users size={24} className="text-primary" />
            </div>
            <TrendingUp size={20} className="text-status-success" />
          </div>
          <h3 className="text-sm font-medium text-text-secondary mb-1">Total de Grupos</h3>
          <p className="text-2xl font-bold text-text-primary">{financials.totalGroups}</p>
        </div>

        <div className="bg-white rounded-custom border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Users size={24} className="text-primary" />
            </div>
            <TrendingUp size={20} className="text-status-success" />
          </div>
          <h3 className="text-sm font-medium text-text-secondary mb-1">Total de Pessoas</h3>
          <p className="text-2xl font-bold text-text-primary">{financials.totalPeople}</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-custom border border-border p-6 shadow-sm">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <CreditCard size={20} />
            Médias
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Preço médio por passeio</span>
              <span className="font-bold text-text-primary">
                R$ {financials.averageTourPrice.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className="h-px bg-border"></div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Receita por pessoa</span>
              <span className="font-bold text-text-primary">
                R$ {financials.revenuePerPerson.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-custom border border-border p-6 shadow-sm">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <Map size={20} />
            Resumo por Viagem
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {trips.length === 0 ? (
              <p className="text-text-secondary text-sm">Nenhuma viagem cadastrada</p>
            ) : (
              trips.map(trip => {
                const tripTours = tours.filter(t => t.tripId === trip.id);
                const tripGroups = groups.filter(g => g.tripId === trip.id);
                const tripRevenue = tripTours.reduce((sum, tour) => sum + tour.price, 0);
                const tripPeople = tripGroups.reduce((sum, group) => sum + group.membersCount + 1, 0);

                return (
                  <div key={trip.id} className="p-3 bg-surface rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-text-primary text-sm">{trip.name}</span>
                      <span className="text-xs font-bold text-primary">
                        R$ {tripRevenue.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-secondary">
                      <span>{tripTours.length} passeios</span>
                      <span>{tripGroups.length} grupos</span>
                      <span>{tripPeople} pessoas</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {trips.length === 0 && tours.length === 0 && (
        <div className="bg-white rounded-custom border border-border border-dashed p-12 text-center">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 text-text-disabled">
            <DollarSign size={32} />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-1">Nenhum dado financeiro disponível</h3>
          <p className="text-text-secondary mb-4">Crie viagens e passeios para ver as estatísticas financeiras.</p>
        </div>
      )}
    </div>
  );
};

export default FinancialView;

