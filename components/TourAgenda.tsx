import React, { useMemo } from 'react';
import { Calendar, Clock, MapPin, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Tour, Trip, Group } from '../types';

interface TourAgendaProps {
  tours: Tour[];
  trips: Trip[];
  userGroup: Group;
}

const TourAgenda: React.FC<TourAgendaProps> = ({ tours, trips, userGroup }) => {
  // Filtrar apenas passeios confirmados pelo grupo
  const confirmedTours = useMemo(() => {
    return tours
      .filter(tour => {
        const attendance = userGroup.tourAttendance?.[tour.id];
        return attendance && attendance.length > 0;
      })
      .map(tour => {
        const trip = trips.find(t => t.id === tour.tripId);
        const attendance = userGroup.tourAttendance?.[tour.id] || [];
        return {
          ...tour,
          trip,
          attendanceCount: attendance.length,
          attendingMembers: attendance
        };
      })
      .sort((a, b) => {
        // Ordenar por data e depois por horário
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
  }, [tours, trips, userGroup]);

  // Agrupar por data
  const toursByDate = useMemo(() => {
    const grouped: Record<string, typeof confirmedTours> = {};
    
    confirmedTours.forEach(tour => {
      const dateKey = new Date(tour.date).toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(tour);
    });
    
    return grouped;
  }, [confirmedTours]);

  const dateKeys = Object.keys(toursByDate).sort((a, b) => {
    // Ordenar datas
    const dateA = new Date(a.split(',')[1]?.trim() || a);
    const dateB = new Date(b.split(',')[1]?.trim() || b);
    return dateA.getTime() - dateB.getTime();
  });

  if (confirmedTours.length === 0) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-[24px] border border-border p-12 text-center">
          <Calendar size={64} className="mx-auto mb-4 text-text-disabled" />
          <h2 className="text-2xl font-bold text-text-primary mb-2">Nenhum passeio confirmado</h2>
          <p className="text-text-secondary">
            Você ainda não confirmou presença em nenhum passeio. Confirme sua presença nos passeios para vê-los aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Minha Agenda</h1>
        <p className="text-text-secondary">
          {confirmedTours.length} passeio{confirmedTours.length !== 1 ? 's' : ''} confirmado{confirmedTours.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Agenda por Data */}
      <div className="space-y-6">
        {dateKeys.map(dateKey => {
          const toursForDate = toursByDate[dateKey];
          const [weekday, ...dateParts] = dateKey.split(',');
          const fullDate = dateParts.join(',').trim();
          
          return (
            <div key={dateKey} className="bg-white rounded-[24px] border border-border overflow-hidden shadow-sm">
              {/* Data Header */}
              <div className="bg-primary/5 border-b border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calendar size={24} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary capitalize">
                      {weekday}
                    </h2>
                    <p className="text-sm text-text-secondary">{fullDate}</p>
                  </div>
                </div>
              </div>

              {/* Passeios do Dia */}
              <div className="divide-y divide-border">
                {toursForDate.map((tour, idx) => (
                  <div 
                    key={tour.id} 
                    className="p-6 hover:bg-surface/30 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {/* Imagem */}
                      {tour.imageUrl && (
                        <div className="w-full md:w-32 h-32 rounded-xl overflow-hidden flex-shrink-0">
                          <img 
                            src={tour.imageUrl} 
                            alt={tour.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Conteúdo */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle2 size={20} className="text-status-success flex-shrink-0" />
                              <h3 className="text-xl font-bold text-text-primary">{tour.name}</h3>
                            </div>
                            {tour.trip && (
                              <p className="text-sm text-text-secondary mb-2">
                                {tour.trip.name} • {tour.trip.destination}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-lg font-bold text-primary">
                              R$ {tour.price.toFixed(2)}
                            </div>
                            <div className="text-xs text-text-secondary">
                              por pessoa
                            </div>
                          </div>
                        </div>

                        {/* Informações */}
                        <div className="flex flex-wrap gap-4 mb-3">
                          <div className="flex items-center gap-2 text-sm text-text-secondary">
                            <Clock size={16} className="text-primary" />
                            {tour.time}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-text-secondary">
                            <MapPin size={16} className="text-primary" />
                            {tour.description || 'Local a definir'}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-text-secondary">
                            <Users size={16} className="text-primary" />
                            {tour.attendanceCount} pessoa{tour.attendanceCount !== 1 ? 's' : ''} confirmada{tour.attendanceCount !== 1 ? 's' : ''}
                          </div>
                        </div>

                        {/* Membros Confirmados */}
                        {tour.attendingMembers && tour.attendingMembers.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                              Participantes:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {tour.attendingMembers.map((member, memberIdx) => (
                                <span 
                                  key={memberIdx}
                                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary border border-primary/20"
                                >
                                  {member}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Links Externos */}
                        {tour.links && tour.links.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {tour.links.map((link, linkIdx) => (
                              <a
                                key={linkIdx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                              >
                                {link.title}
                                <ArrowRight size={14} />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumo */}
      <div className="mt-6 bg-white rounded-[24px] border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-secondary mb-1">Total de passeios confirmados</p>
            <p className="text-2xl font-bold text-text-primary">{confirmedTours.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-text-secondary mb-1">Valor total estimado</p>
            <p className="text-2xl font-bold text-status-success">
              R$ {confirmedTours.reduce((sum, tour) => sum + (tour.price * tour.attendanceCount), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourAgenda;


