import React, { useState } from 'react';
import { ArrowLeft, Users, Calendar, Clock, MapPin, Search, Phone, Mail, FileText, Download, Printer } from 'lucide-react';
import { Tour, Trip, Group } from '../types';
import Button from './Button';

interface TourAttendanceViewProps {
  tour: Tour;
  trip: Trip;
  groups: Group[];
  onBack: () => void;
}

const TourAttendanceView: React.FC<TourAttendanceViewProps> = ({
  tour,
  trip,
  groups = [], // Default empty array
  onBack
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Process data to find attending groups
  // Only show groups that have confirmed attendance for this specific tour
  const attendingGroups = groups
    .filter(g => {
      if (!g) return false;
      if (!g.tourAttendance) return false;
      if (!g.tourAttendance[tour.id]) return false;
      
      // Handle both formats: array of strings or TourAttendanceInfo object
      const attendance = g.tourAttendance[tour.id];
      let members: string[] = [];
      
      if (Array.isArray(attendance)) {
        // Old format: array of strings
        members = attendance;
      } else if (attendance && typeof attendance === 'object' && 'members' in attendance) {
        // New format: TourAttendanceInfo object
        members = attendance.members || [];
      }
      
      // Only include groups with at least one member attending
      return members.length > 0;
    })
    .map(g => {
      // Extract members correctly based on format
      const attendance = g.tourAttendance![tour.id];
      let members: string[] = [];
      
      if (Array.isArray(attendance)) {
        members = attendance;
      } else if (attendance && typeof attendance === 'object' && 'members' in attendance) {
        members = attendance.members || [];
      }
      
      return {
        ...g,
        attendingCount: members.length,
        attendingNames: members
      };
    });

  // Statistics
  const totalPeople = attendingGroups.reduce((acc, curr) => acc + curr.attendingCount, 0);
  
  // Calcular receita real baseada no tipo de ingresso selecionado por cada grupo
  const calculateTotalRevenue = () => {
    return attendingGroups.reduce((total, group) => {
      const attendance = group.tourAttendance?.[tour.id];
      const attendingCount = group.attendingCount;
      
      if (!attendance || attendingCount === 0) return total;
      
      // Obter selectedPriceKey
      let selectedPriceKey: string | undefined = undefined;
      if (attendance && typeof attendance === 'object' && 'selectedPriceKey' in attendance) {
        selectedPriceKey = attendance.selectedPriceKey || undefined;
      }
      
      // Se houver preços dinâmicos e um tipo selecionado, usar esse preço
      if (tour.prices && selectedPriceKey) {
        let selectedPrice = tour.prices[selectedPriceKey as keyof typeof tour.prices];
        
        // Correspondência case-insensitive
        if (!selectedPrice && tour.prices) {
          const priceEntries = Object.entries(tour.prices);
          const matched = priceEntries.find(([key]) => key.toLowerCase() === selectedPriceKey?.toLowerCase());
          if (matched) {
            selectedPrice = matched[1] as any;
          }
        }
        
        if (selectedPrice && selectedPrice.value !== undefined) {
          return total + (attendingCount * selectedPrice.value);
        }
      }
      
      // Caso contrário, usar preço padrão
      return total + (attendingCount * tour.price);
    }, 0);
  };

  const totalRevenue = calculateTotalRevenue();
  
  // Filter logic
  const filteredGroups = attendingGroups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.leaderName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onBack}
          className="flex items-center text-text-secondary hover:text-primary transition-colors font-medium text-sm group"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center mr-2 group-hover:border-primary group-hover:text-primary">
             <ArrowLeft size={16} />
          </div>
          Voltar para {trip?.name || 'Viagem'}
        </button>
        
        <div className="flex gap-2">
           <Button variant="outline" className="h-10 text-xs sm:text-sm px-3 sm:px-4 bg-white">
              <Printer size={16} className="mr-2" />
              Imprimir
           </Button>
           <Button variant="outline" className="h-10 text-xs sm:text-sm px-3 sm:px-4 bg-white">
              <Download size={16} className="mr-2" />
              Exportar CSV
           </Button>
        </div>
      </div>

      {/* Tour Header Card */}
      <div className="bg-white rounded-[24px] border border-border p-6 md:p-8 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                 Passeio Confirmado
               </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">{tour.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
               <div className="flex items-center gap-1.5">
                  <Calendar size={16} className="text-primary" />
                  {new Date(tour.date).toLocaleDateString()}
               </div>
               <div className="flex items-center gap-1.5">
                  <Clock size={16} className="text-primary" />
                  {tour.time}
               </div>
               <div className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-primary" />
                  {tour.description}
               </div>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="flex gap-4">
             <div className="bg-surface rounded-2xl p-4 min-w-[120px] text-center border border-border">
                <p className="text-xs text-text-secondary font-semibold uppercase mb-1">Passageiros</p>
                <p className="text-2xl font-bold text-primary">{totalPeople}</p>
             </div>
             <div className="bg-surface rounded-2xl p-4 min-w-[120px] text-center border border-border">
                <p className="text-xs text-text-secondary font-semibold uppercase mb-1">Receita</p>
                <p className="text-2xl font-bold text-status-success">
                  R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="bg-white rounded-[24px] border border-border shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
           <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Users size={20} className="text-primary" />
              Lista de Passageiros ({filteredGroups.length} grupos)
           </h2>
           <div className="relative w-full sm:w-72">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input 
                type="text" 
                placeholder="Buscar grupo ou líder..."
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-border text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
              <thead className="bg-surface border-b border-border">
                 <tr>
                    <th className="py-4 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider w-1/4">GRUPO / FAMÍLIA</th>
                    <th className="py-4 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider w-1/4">LÍDER DO GRUPO</th>
                    <th className="py-4 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider w-1/6 text-center">QTD.</th>
                    <th className="py-4 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider w-1/3">NOMES CONFIRMADOS</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-border">
                 {filteredGroups.length > 0 ? (
                    filteredGroups.map((group) => (
                       <tr key={group.id} className="hover:bg-surface/30 transition-colors">
                          <td className="py-4 px-6 align-top">
                             <div className="font-semibold text-text-primary">{group.name}</div>
                             <div className="text-xs text-text-secondary mt-1">Ref: #{group.id.substring(0,6)}</div>
                          </td>
                          <td className="py-4 px-6 align-top">
                             <div className="font-medium text-text-primary">{group.leaderName}</div>
                             {group.leaderPhone && (
                                <div className="flex items-center gap-1 text-xs text-text-secondary mt-1">
                                   <Phone size={12} /> {group.leaderPhone}
                                </div>
                             )}
                             {group.leaderEmail && (
                                <div className="flex items-center gap-1 text-xs text-text-secondary mt-0.5">
                                   <Mail size={12} /> {group.leaderEmail}
                                </div>
                             )}
                          </td>
                          <td className="py-4 px-6 align-top text-center">
                             <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                                {group.attendingCount}
                             </span>
                          </td>
                          <td className="py-4 px-6 align-top">
                             <div className="flex flex-wrap gap-2">
                                {group.attendingNames.map((name, idx) => (
                                   <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-border text-text-primary shadow-sm">
                                      {name}
                                   </span>
                                ))}
                             </div>
                          </td>
                       </tr>
                    ))
                 ) : (
                    <tr>
                       <td colSpan={4} className="py-12 text-center text-text-secondary">
                          <div className="flex flex-col items-center justify-center">
                             <FileText size={40} className="text-text-disabled mb-3" />
                             {groups.length === 0 ? (
                                <p>Nenhum grupo cadastrado nesta viagem.</p>
                             ) : searchTerm ? (
                                <p>Nenhum passageiro encontrado com os filtros atuais.</p>
                             ) : (
                                <div>
                                   <p className="font-medium mb-2">Nenhum grupo confirmou presença neste passeio ainda.</p>
                                   <p className="text-sm text-text-disabled">Os grupos precisam confirmar presença para aparecer aqui.</p>
                                </div>
                             )}
                          </div>
                       </td>
                    </tr>
                 )}
              </tbody>
           </table>
        </div>
        
        {/* Footer Summary */}
        <div className="bg-surface p-4 border-t border-border flex justify-end gap-6 text-sm">
           <div className="flex items-center gap-2">
              <span className="text-text-secondary">Grupos:</span>
              <span className="font-bold text-text-primary">{filteredGroups.length}</span>
           </div>
           <div className="flex items-center gap-2">
              <span className="text-text-secondary">Total Pessoas:</span>
              <span className="font-bold text-text-primary">{filteredGroups.reduce((acc, g) => acc + g.attendingCount, 0)}</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TourAttendanceView;