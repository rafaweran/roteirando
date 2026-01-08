import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, Download, Edit, Trash2, Users, X, User, Plus } from 'lucide-react';
import { MOCK_GROUPS, MOCK_TRIPS } from '../data';
import Button from './Button';
import Modal from './Modal';
import { Group } from '../types';

interface GroupsListProps {
  onEdit?: (group: Group) => void;
  onDelete?: (groupId: string) => void;
  onAddGroup: () => void;
}

const GroupsList: React.FC<GroupsListProps> = ({ onEdit, onDelete, onAddGroup }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest('.action-menu-container') === null) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const handleDeleteClick = (group: Group) => {
    setActiveMenuId(null);
    setGroupToDelete(group);
    setDeleteModalOpen(true);
  };

  const handleEditClick = (group: Group) => {
    setActiveMenuId(null);
    if (onEdit) onEdit(group);
  };

  const handleConfirmDelete = () => {
    if (groupToDelete && onDelete) {
      onDelete(groupToDelete.id);
      setDeleteModalOpen(false);
      setGroupToDelete(null);
    }
  };

  // Enrich groups with Trip data
  const enrichedGroups = MOCK_GROUPS.map(group => {
    const trip = MOCK_TRIPS.find(t => t.id === group.tripId);
    return {
      ...group,
      tripName: trip ? trip.name : 'Viagem desconhecida',
      tripImage: trip ? trip.imageUrl : '',
      tripStatus: trip ? trip.status : ''
    };
  });

  // Filter Logic
  const filteredGroups = enrichedGroups.filter(group => {
    const searchLower = searchTerm.toLowerCase();
    return (
      group.name.toLowerCase().includes(searchLower) ||
      group.leaderName.toLowerCase().includes(searchLower) ||
      group.tripName.toLowerCase().includes(searchLower)
    );
  });

  const ActionMenu = ({ group }: { group: any }) => (
    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-border z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
      <div className="p-1 flex flex-col gap-0.5">
        <button 
          onClick={() => handleEditClick(group)}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-text-secondary hover:text-primary hover:bg-surface rounded-lg transition-colors text-left"
        >
          <Edit size={16} />
          Editar Grupo
        </button>
        <div className="h-px bg-border my-1 mx-2"></div>
        <button 
          onClick={() => handleDeleteClick(group)}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-status-error hover:bg-status-error/5 rounded-lg transition-colors text-left font-medium"
        >
          <Trash2 size={16} />
          Deletar
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Todos os Grupos</h1>
            <p className="text-text-secondary mt-1">Gerencie os grupos e famílias das viagens</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="h-10 px-4 text-sm">
              <Download size={18} className="mr-2" />
              Exportar
            </Button>
            <Button 
              className="h-10 px-4 text-sm"
              onClick={onAddGroup}
            >
              <Plus size={18} className="mr-2" />
              Novo Grupo
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-5 rounded-custom border border-border mb-6 shadow-sm transition-all duration-300">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Buscar por nome do grupo, líder ou viagem..."
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="flex items-center justify-center px-4 h-10 text-sm font-medium text-text-secondary bg-surface hover:bg-status-error/10 hover:text-status-error rounded-lg transition-colors border border-transparent hover:border-status-error/20"
              >
                <X size={16} className="mr-2" />
                Limpar Busca
              </button>
            )}
          </div>
        </div>

        {filteredGroups.length > 0 ? (
          <>
            {/* MOBILE VIEW: Cards */}
            <div className="md:hidden flex flex-col gap-4">
              {filteredGroups.map((group) => (
                <div key={group.id} className="bg-white rounded-[20px] border border-border p-5 shadow-sm relative overflow-visible">
                  <div className="flex gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <Users size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-text-primary line-clamp-1">{group.name}</h3>
                      <div className="flex items-center text-xs text-text-secondary mt-1">
                        <User size={12} className="mr-1" />
                        Líder: {group.leaderName}
                      </div>
                    </div>
                    
                    <div className="relative action-menu-container">
                      <button 
                        onClick={(e) => handleToggleMenu(e, group.id)}
                        className={`p-2 rounded-full transition-colors ${activeMenuId === group.id ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-primary hover:bg-surface'}`}
                      >
                        <MoreVertical size={20} />
                      </button>
                      {activeMenuId === group.id && <ActionMenu group={group} />}
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-border/60 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Viagem</span>
                      <span className="text-sm font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                        {group.tripName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Total de Pessoas</span>
                      <span className="text-sm font-bold text-text-primary">
                        {group.membersCount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP VIEW: Table */}
            <div className="hidden md:block bg-white rounded-custom border border-border shadow-sm overflow-visible"> 
              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface border-b border-border">
                      <th className="py-4 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider">Grupo</th>
                      <th className="py-4 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider">Quantidade</th>
                      <th className="py-4 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider">Viagem</th>
                      <th className="py-4 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredGroups.map((group) => (
                      <tr key={group.id} className="hover:bg-surface/50 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-text-secondary group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-colors">
                              <Users size={18} />
                            </div>
                            <div>
                              <p className="font-semibold text-text-primary">{group.name}</p>
                              <div className="flex items-center text-xs text-text-secondary mt-0.5">
                                <User size={12} className="mr-1" />
                                {group.leaderName}
                              </div>
                            </div>
                          </div>
                        </td>
                         <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface text-text-primary border border-border">
                            <Users size={12} className="text-text-secondary" />
                            {group.membersCount} pessoas
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                             {group.tripImage && (
                               <img src={group.tripImage} alt="" className="w-6 h-6 rounded-full object-cover" />
                             )}
                             <span className="text-sm font-medium text-text-secondary">
                              {group.tripName}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right relative action-menu-container">
                          <button 
                            onClick={(e) => handleToggleMenu(e, group.id)}
                            className={`p-2 rounded-full transition-colors ${activeMenuId === group.id ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-primary hover:bg-surface'}`}
                          >
                            <MoreVertical size={18} />
                          </button>
                          {activeMenuId === group.id && <ActionMenu group={group} />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-custom border border-border p-12 text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 text-text-disabled">
              <Users size={24} />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-1">Nenhum grupo encontrado</h3>
            <p className="text-text-secondary mb-4">Tente buscar por outro termo.</p>
            <Button variant="outline" onClick={() => setSearchTerm('')}>
              Limpar Busca
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Excluir Grupo"
        description={`Tem certeza que deseja excluir o grupo "${groupToDelete?.name}"? Esta ação não pode ser desfeita.`}
        variant="danger"
        confirmLabel="Sim, excluir"
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default GroupsList;