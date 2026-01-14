import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, TrendingUp, CreditCard, Calendar, Users, Map, Trophy, Clock } from 'lucide-react';
import { tripsApi, toursApi, groupsApi } from '../lib/database';
import { Trip, Tour, Group } from '../types';
import { getAttendanceMembers, getPricePerPerson } from '../lib/pricing';

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

  // Calcular estatísticas financeiras baseadas em confirmações reais
  const financials = useMemo(() => {
    let totalRevenue = 0;
    let totalTours = 0;
    let totalGroups = 0;
    let totalPeople = 0;
    let confirmedPeople = 0;

    // Calcular receita real baseada em confirmações
    tours.forEach(tour => {
      totalTours++;
      
      // Contar grupos e pessoas que confirmaram presença neste passeio
      let tourConfirmedGroups = 0;
      let tourConfirmedPeople = 0;
      
      groups.forEach(group => {
        if (group.tourAttendance && group.tourAttendance[tour.id]) {
          const attendance = group.tourAttendance[tour.id];
          const members = getAttendanceMembers(attendance as any);
          
          if (members.length > 0) {
            tourConfirmedGroups++;
            tourConfirmedPeople += members.length;
            const pricePerPerson = getPricePerPerson(tour, attendance as any);
            totalRevenue += pricePerPerson * members.length;
          }
        }
      });
    });

    groups.forEach(group => {
      totalGroups++;
      totalPeople += group.membersCount + 1; // +1 para o líder
    });

    // Contar pessoas confirmadas em todos os passeios
    groups.forEach(group => {
      if (group.tourAttendance) {
        Object.values(group.tourAttendance).forEach(attendance => {
          let members: string[] = [];
          if (Array.isArray(attendance)) {
            members = attendance;
          } else if (attendance && typeof attendance === 'object' && 'members' in attendance) {
            members = attendance.members || [];
          }
          confirmedPeople += members.length;
        });
      }
    });

    const averageTourPrice = totalTours > 0 ? totalRevenue / totalTours : 0;
    const revenuePerPerson = confirmedPeople > 0 ? totalRevenue / confirmedPeople : 0;

    return {
      totalRevenue,
      totalTours,
      totalGroups,
      totalPeople,
      confirmedPeople,
      averageTourPrice,
      revenuePerPerson
    };
  }, [tours, groups]);

  // Calcular top passeios mais escolhidos
  const topTours = useMemo(() => {
    const tourStats = tours.map(tour => {
      let confirmedGroups = 0;
      let confirmedPeople = 0;
      let revenue = 0;

      groups.forEach(group => {
        if (group.tourAttendance && group.tourAttendance[tour.id]) {
          const attendance = group.tourAttendance[tour.id];
          const members = getAttendanceMembers(attendance as any);
          
          if (members.length > 0) {
            confirmedGroups++;
            confirmedPeople += members.length;
            const pricePerPerson = getPricePerPerson(tour, attendance as any);
            revenue += pricePerPerson * members.length;
          }
        }
      });

      return {
        tour,
        confirmedGroups,
        confirmedPeople,
        revenue
      };
    });

    // Ordenar por número de pessoas confirmadas (mais escolhidos)
    return tourStats
      .filter(stat => stat.confirmedPeople > 0)
      .sort((a, b) => b.confirmedPeople - a.confirmedPeople)
      .slice(0, 10); // Top 10
  }, [tours, groups]);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-custom border border-border p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <DollarSign size={20} className="sm:w-6 sm:h-6 text-primary" />
            </div>
            <TrendingUp size={18} className="sm:w-5 sm:h-5 text-status-success" />
          </div>
          <h3 className="text-xs sm:text-sm font-medium text-text-secondary mb-1">Receita Total</h3>
          <p className="text-xl sm:text-2xl font-bold text-text-primary break-words">
            R$ {financials.totalRevenue.toFixed(2).replace('.', ',')}
          </p>
        </div>

        <div className="bg-white rounded-custom border border-border p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Calendar size={20} className="sm:w-6 sm:h-6 text-primary" />
            </div>
            <TrendingUp size={18} className="sm:w-5 sm:h-5 text-status-success" />
          </div>
          <h3 className="text-xs sm:text-sm font-medium text-text-secondary mb-1">Total de Passeios</h3>
          <p className="text-xl sm:text-2xl font-bold text-text-primary">{financials.totalTours}</p>
        </div>

        <div className="bg-white rounded-custom border border-border p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Users size={20} className="sm:w-6 sm:h-6 text-primary" />
            </div>
            <TrendingUp size={18} className="sm:w-5 sm:h-5 text-status-success" />
          </div>
          <h3 className="text-xs sm:text-sm font-medium text-text-secondary mb-1">Total de Grupos</h3>
          <p className="text-xl sm:text-2xl font-bold text-text-primary">{financials.totalGroups}</p>
        </div>

        <div className="bg-white rounded-custom border border-border p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Users size={20} className="sm:w-6 sm:h-6 text-primary" />
            </div>
            <TrendingUp size={18} className="sm:w-5 sm:h-5 text-status-success" />
          </div>
          <h3 className="text-xs sm:text-sm font-medium text-text-secondary mb-1">Pessoas Confirmadas</h3>
          <p className="text-xl sm:text-2xl font-bold text-text-primary">{financials.confirmedPeople}</p>
          <p className="text-[10px] sm:text-xs text-text-disabled mt-1">de {financials.totalPeople} total</p>
        </div>
      </div>

      {/* Top Passeios Mais Escolhidos */}
      {topTours.length > 0 && (
        <div className="bg-white rounded-custom border border-border p-6 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
              <Trophy size={24} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Top Passeios Mais Escolhidos</h3>
              <p className="text-sm text-text-secondary">Os passeios com mais confirmações de presença</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {topTours.map((stat, index) => {
              const trip = trips.find(t => t.id === stat.tour.tripId);
              const medalColors = [
                'from-yellow-400 to-yellow-600', // Ouro
                'from-gray-300 to-gray-500',      // Prata
                'from-orange-400 to-orange-600'   // Bronze
              ];
              const medalColor = index < 3 ? medalColors[index] : 'from-primary/20 to-primary/10';
              
              return (
                <div 
                  key={stat.tour.id} 
                  className="p-4 bg-surface rounded-xl border border-border hover:border-primary/30 transition-all hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    {/* Ranking Badge */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${medalColor} flex items-center justify-center font-bold text-white text-lg shadow-sm`}>
                      {index < 3 ? (
                        <Trophy size={20} />
                      ) : (
                        <span>#{index + 1}</span>
                      )}
                    </div>
                    
                    {/* Tour Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-text-primary text-base mb-1 line-clamp-1">
                            {stat.tour.name}
                          </h4>
                          {trip && (
                            <p className="text-xs text-text-secondary flex items-center gap-1">
                              <Map size={12} />
                              {trip.name}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {new Date(stat.tour.date).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {stat.tour.time}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-border/50">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-xs text-text-secondary mb-1">
                            <Users size={12} />
                            <span>Grupos</span>
                          </div>
                          <p className="font-bold text-text-primary text-sm">{stat.confirmedGroups}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-xs text-text-secondary mb-1">
                            <Users size={12} />
                            <span>Pessoas</span>
                          </div>
                          <p className="font-bold text-text-primary text-sm">{stat.confirmedPeople}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-xs text-text-secondary mb-1">
                            <DollarSign size={12} />
                            <span>Receita</span>
                          </div>
                          <p className="font-bold text-primary text-sm">
                            R$ {stat.revenue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-custom border border-border p-6 shadow-sm">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <CreditCard size={20} />
            Médias
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Receita média por passeio</span>
              <span className="font-bold text-text-primary">
                R$ {financials.averageTourPrice.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className="h-px bg-border"></div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Receita por pessoa confirmada</span>
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
                
                // Calcular receita real baseada em confirmações
                let tripRevenue = 0;
                let tripConfirmedPeople = 0;
                
                tripTours.forEach(tour => {
                  tripGroups.forEach(group => {
                    if (group.tourAttendance && group.tourAttendance[tour.id]) {
                      const attendance = group.tourAttendance[tour.id];
                      const members = getAttendanceMembers(attendance as any);
                      
                      if (members.length > 0) {
                        tripConfirmedPeople += members.length;
                        const pricePerPerson = getPricePerPerson(tour, attendance as any);
                        tripRevenue += pricePerPerson * members.length;
                      }
                    }
                  });
                });
                
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
                      <span>{tripConfirmedPeople} confirmados</span>
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


