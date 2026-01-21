import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Calendar, Clock, MapPin, Loader2, DollarSign } from 'lucide-react';
import { UserCustomTour, Group } from '../types';
import { userCustomToursApi } from '../lib/database';
import Button from './Button';
import Modal from './Modal';
import UserCustomTourForm from './UserCustomTourForm';
import { useToast } from '../hooks/useToast';

interface UserCustomToursPageProps {
  userGroup: Group;
  onBack: () => void;
}

const UserCustomToursPage: React.FC<UserCustomToursPageProps> = ({ userGroup, onBack }) => {
  const { showSuccess, showError } = useToast();
  const [tours, setTours] = useState<UserCustomTour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTour, setEditingTour] = useState<UserCustomTour | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tourToDelete, setTourToDelete] = useState<UserCustomTour | null>(null);
  
  // Estados para modal de edição rápida de data/hora
  const [quickEditModalOpen, setQuickEditModalOpen] = useState(false);
  const [tourToQuickEdit, setTourToQuickEdit] = useState<UserCustomTour | null>(null);
  const [quickEditData, setQuickEditData] = useState({ date: '', time: '' });
  const [isQuickEditing, setIsQuickEditing] = useState(false);

  // Carregar passeios
  useEffect(() => {
    loadTours();
  }, [userGroup.id]);

  const loadTours = async () => {
    try {
      setIsLoading(true);
      const data = await userCustomToursApi.getByGroupId(userGroup.id);
      setTours(data);
    } catch (error: any) {
      console.error('Erro ao carregar passeios:', error);
      showError('Erro ao carregar passeios personalizados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingTour(null);
    setShowForm(true);
  };

  const handleEdit = (tour: UserCustomTour) => {
    setEditingTour(tour);
    setShowForm(true);
  };

  const handleDeleteClick = (tour: UserCustomTour) => {
    setTourToDelete(tour);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!tourToDelete) return;

    try {
      await userCustomToursApi.delete(tourToDelete.id);
      showSuccess('Passeio deletado com sucesso!');
      setDeleteModalOpen(false);
      setTourToDelete(null);
      loadTours();
    } catch (error: any) {
      console.error('Erro ao deletar passeio:', error);
      showError('Erro ao deletar passeio');
    }
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingTour(null);
    loadTours();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingTour(null);
  };

  const handleQuickEditClick = (tour: UserCustomTour) => {
    setTourToQuickEdit(tour);
    setQuickEditData({ date: tour.date, time: tour.time });
    setQuickEditModalOpen(true);
  };

  const handleQuickEditSave = async () => {
    if (!tourToQuickEdit) return;

    // Validação
    if (!quickEditData.date || !quickEditData.time) {
      showError('Data e horário são obrigatórios');
      return;
    }

    try {
      setIsQuickEditing(true);
      await userCustomToursApi.update(tourToQuickEdit.id, {
        date: quickEditData.date,
        time: quickEditData.time
      });
      showSuccess('Data e horário atualizados com sucesso!');
      setQuickEditModalOpen(false);
      setTourToQuickEdit(null);
      loadTours();
    } catch (error: any) {
      console.error('Erro ao atualizar data/hora:', error);
      showError('Erro ao atualizar data e horário');
    } finally {
      setIsQuickEditing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (showForm) {
    return (
      <UserCustomTourForm
        group={userGroup}
        initialData={editingTour}
        onSave={handleFormSave}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary-light transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Meus Passeios Personalizados</h1>
            <p className="text-sm text-text-secondary">Gerencie seus passeios personalizados na agenda</p>
          </div>
        </div>
        <Button
          onClick={handleAddNew}
          className="min-h-[52px] sm:h-[48px] px-6 text-base sm:text-sm font-semibold"
        >
          <Plus size={18} className="mr-2" />
          Novo Passeio
        </Button>
      </div>

      {/* Lista de Passeios */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : tours.length === 0 ? (
        <div className="bg-white rounded-xl sm:rounded-[24px] border border-border p-12 text-center">
          <Calendar size={48} className="mx-auto mb-4 text-text-disabled" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Nenhum passeio personalizado
          </h3>
          <p className="text-text-secondary mb-6">
            Cadastre seus próprios passeios para aparecerem na sua agenda
          </p>
          <Button onClick={handleAddNew} className="w-[260px]">
            <Plus size={18} className="mr-2" />
            Cadastrar Primeiro Passeio
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {tours.map((tour) => (
            <div
              key={tour.id}
              className="bg-white rounded-xl sm:rounded-[24px] border border-border overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Imagem */}
              {tour.imageUrl && (
                <div className="w-full h-48 overflow-hidden">
                  <img
                    src={tour.imageUrl}
                    alt={tour.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Conteúdo */}
              <div className="p-4 sm:p-6">
                <h3 className="text-lg font-bold text-text-primary mb-3 line-clamp-2">
                  {tour.name}
                </h3>

                {/* Data e Horário */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <div className="inline-flex items-center text-xs font-medium text-text-secondary bg-surface px-2.5 py-1 rounded-md border border-border/50">
                    <Calendar size={14} className="mr-1.5 text-primary" />
                    {formatDate(tour.date)}
                  </div>
                  <div className="inline-flex items-center text-xs font-medium text-text-secondary bg-surface px-2.5 py-1 rounded-md border border-border/50">
                    <Clock size={14} className="mr-1.5 text-primary" />
                    {tour.time}
                  </div>
                  {tour.price !== undefined && tour.price !== null && (
                    <div className="inline-flex items-center text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">
                      <DollarSign size={14} className="mr-1.5" />
                      R$ {tour.price.toFixed(2)}
                    </div>
                  )}
                </div>

                {/* Endereço */}
                {tour.address && (
                  <div className="flex items-start gap-2 mb-3 text-xs text-text-secondary">
                    <MapPin size={14} className="mt-0.5 flex-shrink-0 text-primary" />
                    <span className="line-clamp-2">{tour.address}</span>
                  </div>
                )}

                {/* Local/Ponto de Encontro */}
                {tour.location && (
                  <div className="mb-3 text-xs text-text-secondary">
                    <span className="font-medium">Local: </span>
                    {tour.location}
                  </div>
                )}

                {/* Descrição */}
                {tour.description && (
                  <p className="text-sm text-text-secondary mb-4 line-clamp-3">
                    {tour.description}
                  </p>
                )}

                {/* Ações */}
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    className="flex-1 min-h-[44px] text-sm font-semibold"
                    onClick={() => handleQuickEditClick(tour)}
                  >
                    <Clock size={16} className="mr-2" />
                    Data/Hora
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 min-h-[44px] text-sm font-semibold"
                    onClick={() => handleEdit(tour)}
                  >
                    <Edit2 size={16} className="mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    className="min-h-[44px] px-4 text-sm font-semibold text-status-error border-status-error/30 hover:bg-status-error/5"
                    onClick={() => handleDeleteClick(tour)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setTourToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Deletar Passeio"
        description={`Tem certeza que deseja deletar o passeio "${tourToDelete?.name}"? Esta ação não pode ser desfeita.`}
        variant="danger"
        confirmLabel="Deletar"
        cancelLabel="Cancelar"
      />

      {/* Modal de Edição Rápida de Data/Hora */}
      {quickEditModalOpen && tourToQuickEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl sm:rounded-[24px] shadow-2xl w-full max-w-md mx-4 sm:mx-auto relative z-10 animate-in zoom-in-95 duration-200">
            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="text-primary" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-text-primary mb-2">
                    Alterar Data e Horário
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {tourToQuickEdit.name}
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Data */}
                <div>
                  <label className="text-sm font-medium text-text-primary mb-2 block">
                    Data
                  </label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                    <input
                      type="date"
                      value={quickEditData.date}
                      onChange={(e) => setQuickEditData({ ...quickEditData, date: e.target.value })}
                      className="w-full h-12 pl-10 pr-4 rounded-lg border border-border bg-white text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Horário */}
                <div>
                  <label className="text-sm font-medium text-text-primary mb-2 block">
                    Horário
                  </label>
                  <div className="relative">
                    <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                    <input
                      type="time"
                      value={quickEditData.time}
                      onChange={(e) => setQuickEditData({ ...quickEditData, time: e.target.value })}
                      className="w-full h-12 pl-10 pr-4 rounded-lg border border-border bg-white text-sm text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setQuickEditModalOpen(false);
                    setTourToQuickEdit(null);
                  }}
                  disabled={isQuickEditing}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleQuickEditSave}
                  isLoading={isQuickEditing}
                  disabled={isQuickEditing}
                >
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCustomToursPage;
