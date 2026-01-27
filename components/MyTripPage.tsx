import React, { useState, useEffect } from 'react';
import { ArrowLeft, Hotel, Plane, Car, User, Save, Loader2, Users, Link } from 'lucide-react';
import { UserTravelInfo, Group } from '../types';
import { userTravelInfoApi } from '../lib/database';
import Input from './Input';
import Button from './Button';
import DatePicker from './DatePicker';
import { useToast } from '../hooks/useToast';

interface MyTripPageProps {
  userGroup: Group;
  companionGroup?: Group | null;
  onBack: () => void;
}

const MyTripPage: React.FC<MyTripPageProps> = ({ userGroup, companionGroup, onBack }) => {
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'hotel' | 'flight' | 'car' | 'personal' | 'companion'>('hotel');
  
  const [formData, setFormData] = useState<UserTravelInfo>({
    groupId: userGroup.id,
  });

  // Estado para endereço estruturado do hotel
  const [hotelAddressParts, setHotelAddressParts] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  });

  // Carregar dados existentes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await userTravelInfoApi.getByGroupId(userGroup.id);
        if (data) {
          setFormData(data);
          // Parsear endereço em partes se existir
          if (data.hotelAddress) {
            setHotelAddressParts(parseAddress(data.hotelAddress));
          }
        } else {
          // Inicializar com dados do grupo se não houver registro
          setFormData({
            groupId: userGroup.id,
            personalName: userGroup.leaderName,
            personalEmail: userGroup.leaderEmail,
          });
        }
      } catch (error: any) {
        console.error('Erro ao carregar dados:', error);
        // Inicializar com dados do grupo mesmo em caso de erro
        setFormData({
          groupId: userGroup.id,
          personalName: userGroup.leaderName,
          personalEmail: userGroup.leaderEmail,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userGroup.id, userGroup.leaderName, userGroup.leaderEmail]);

  // Atualizar endereço completo quando as partes mudarem
  useEffect(() => {
    const fullAddress = formatFullAddress(hotelAddressParts);
    const currentAddress = formData.hotelAddress || '';
    
    // Só atualizar se o endereço formatado for diferente do atual
    // Evita loop infinito
    if (fullAddress !== currentAddress) {
      if (fullAddress) {
        setFormData(prev => ({ ...prev, hotelAddress: fullAddress }));
      } else if (Object.values(hotelAddressParts).every(v => !v)) {
        // Se todos os campos estiverem vazios, limpar o endereço
        setFormData(prev => ({ ...prev, hotelAddress: '' }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelAddressParts]);

  // Função para formatar endereço completo (otimizado para geocodificação)
  const formatFullAddress = (parts: typeof hotelAddressParts): string => {
    const partsArray: string[] = [];
    
    // Construir endereço na ordem ideal para geocodificação:
    // Rua e número primeiro
    if (parts.street) {
      const streetPart = parts.number 
        ? `${parts.street}, ${parts.number}`
        : parts.street;
      partsArray.push(streetPart);
    }
    
    // Bairro
    if (parts.neighborhood) {
      partsArray.push(parts.neighborhood);
    }
    
    // Cidade e Estado (importante para precisão)
    if (parts.city && parts.state) {
      partsArray.push(`${parts.city}, ${parts.state}`);
    } else if (parts.city) {
      partsArray.push(parts.city);
    } else if (parts.state) {
      partsArray.push(parts.state);
    }
    
    // CEP (opcional, adiciona precisão)
    if (parts.zipCode) {
      const formattedZip = parts.zipCode.length === 8 
        ? `${parts.zipCode.slice(0, 5)}-${parts.zipCode.slice(5)}`
        : parts.zipCode;
      partsArray.push(formattedZip);
    }
    
    // Complemento (adicionar no final para não confundir geocodificação)
    if (parts.complement && partsArray.length > 0) {
      // Adicionar complemento entre rua e bairro se houver
      const result = [partsArray[0], parts.complement, ...partsArray.slice(1)];
      return result.join(', ');
    }
    
    return partsArray.join(', ');
  };

  // Função para parsear endereço completo em partes
  const parseAddress = (address: string | undefined): typeof hotelAddressParts => {
    if (!address) {
      return {
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
      };
    }

    const parts: typeof hotelAddressParts = {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
    };

    // Extrair CEP
    const zipMatch = address.match(/CEP:\s*(\d{5}-?\d{3})/i);
    if (zipMatch) {
      parts.zipCode = zipMatch[1].replace(/-/g, '');
    }

    // Remover CEP do endereço
    let cleanAddress = address.replace(/CEP:.*/i, '').trim();

    // Extrair cidade e estado (formato: "Cidade - Estado")
    const cityStateMatch = cleanAddress.match(/([^,]+)\s*-\s*([A-Z]{2})$/);
    if (cityStateMatch) {
      parts.city = cityStateMatch[1].trim();
      parts.state = cityStateMatch[2].trim();
      cleanAddress = cleanAddress.replace(/\s*-\s*[A-Z]{2}$/, '').trim();
    }

    // Dividir por vírgulas
    const segments = cleanAddress.split(',').map(s => s.trim()).filter(s => s);

    if (segments.length > 0) {
      // Primeiro segmento: rua e número
      const firstSegment = segments[0];
      const streetNumberMatch = firstSegment.match(/^(.+?)\s*,\s*(\d+.*)$/);
      if (streetNumberMatch) {
        parts.street = streetNumberMatch[1].trim();
        parts.number = streetNumberMatch[2].trim();
      } else {
        parts.street = firstSegment;
      }

      // Segundo segmento: complemento ou bairro
      if (segments.length > 1) {
        const secondSegment = segments[1];
        if (secondSegment.toLowerCase().includes('centro') || 
            secondSegment.toLowerCase().includes('bairro') ||
            secondSegment.toLowerCase().includes('distrito')) {
          parts.neighborhood = secondSegment;
        } else {
          parts.complement = secondSegment;
        }
      }

      // Terceiro segmento: bairro (se não foi preenchido)
      if (segments.length > 2 && !parts.neighborhood) {
        parts.neighborhood = segments[2];
      }
    }

    return parts;
  };

  const handleChange = (field: keyof UserTravelInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Garantir que o endereço está atualizado antes de salvar
      const fullAddress = formatFullAddress(hotelAddressParts);
      const dataToSave = {
        ...formData,
        hotelAddress: fullAddress || formData.hotelAddress || ''
      };
      
      console.log('💾 MyTripPage: Salvando dados', {
        hotelAddressParts: hotelAddressParts,
        fullAddress: fullAddress,
        formDataHotelAddress: formData.hotelAddress,
        dataToSave: {
          ...dataToSave,
          hotelAddress: dataToSave.hotelAddress
        }
      });
      
      await userTravelInfoApi.upsert(dataToSave);
      
      // Atualizar formData com o endereço formatado
      setFormData(dataToSave);
      
      console.log('✅ MyTripPage: Dados salvos com sucesso');
      showSuccess('Dados salvos com sucesso!');
    } catch (error: any) {
      console.error('❌ MyTripPage: Erro ao salvar:', error);
      showError(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { id: 'hotel' as const, label: 'Hotel', icon: Hotel },
    { id: 'flight' as const, label: 'Voo', icon: Plane },
    { id: 'car' as const, label: 'Aluguel de Carro', icon: Car },
    { id: 'personal' as const, label: 'Meus Dados', icon: User },
    ...(companionGroup ? [{ id: 'companion' as const, label: 'Grupo Parceiro', icon: Link }] : []),
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary-light transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Minha Viagem</h1>
          <p className="text-text-secondary text-sm">Gerencie suas informações de viagem</p>
        </div>
      </div>

      {/* Tabs de Navegação */}
      <div className="bg-white rounded-[24px] border border-border p-2 mb-6 flex flex-wrap gap-2">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200
                ${isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-primary hover:bg-surface'
                }
              `}
            >
              <Icon size={18} />
              <span>{section.label}</span>
            </button>
          );
        })}
      </div>

      {/* Conteúdo do Formulário */}
      <div className="bg-white rounded-[24px] border border-border p-6 md:p-8 shadow-sm">
        {/* Seção Hotel */}
        {activeSection === 'hotel' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Hotel size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">Informações do Hotel</h2>
                <p className="text-sm text-text-secondary">Cadastre os dados da sua hospedagem</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                id="hotelName"
                label="Nome do Hotel"
                placeholder="Ex: Hotel Grand Plaza"
                value={formData.hotelName || ''}
                onChange={(e) => handleChange('hotelName', e.target.value)}
              />
              <Input
                id="hotelConfirmationCode"
                label="Código de Confirmação"
                placeholder="Ex: ABC123"
                value={formData.hotelConfirmationCode || ''}
                onChange={(e) => handleChange('hotelConfirmationCode', e.target.value)}
              />
            </div>

            {/* Endereço Estruturado */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-primary">
                  Endereço do Hotel *
                </label>
                <span className="text-xs text-text-secondary">
                  Preencha todos os campos para melhor precisão
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Input
                    id="hotelStreet"
                    label="Rua / Avenida"
                    placeholder="Ex: Rua das Flores"
                    value={hotelAddressParts.street}
                    onChange={(e) => setHotelAddressParts(prev => ({ ...prev, street: e.target.value }))}
                  />
                </div>
                <div>
                  <Input
                    id="hotelNumber"
                    label="Número"
                    placeholder="Ex: 123"
                    value={hotelAddressParts.number}
                    onChange={(e) => setHotelAddressParts(prev => ({ ...prev, number: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="hotelComplement"
                  label="Complemento (opcional)"
                  placeholder="Ex: Apto 101, Bloco A"
                  value={hotelAddressParts.complement}
                  onChange={(e) => setHotelAddressParts(prev => ({ ...prev, complement: e.target.value }))}
                />
                <Input
                  id="hotelNeighborhood"
                  label="Bairro"
                  placeholder="Ex: Centro"
                  value={hotelAddressParts.neighborhood}
                  onChange={(e) => setHotelAddressParts(prev => ({ ...prev, neighborhood: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Input
                    id="hotelCity"
                    label="Cidade"
                    placeholder="Ex: Gramado"
                    value={hotelAddressParts.city}
                    onChange={(e) => setHotelAddressParts(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div>
                  <Input
                    id="hotelState"
                    label="Estado (UF)"
                    placeholder="Ex: RS"
                    value={hotelAddressParts.state}
                    onChange={(e) => {
                      const state = e.target.value.toUpperCase().slice(0, 2);
                      setHotelAddressParts(prev => ({ ...prev, state }));
                    }}
                    maxLength={2}
                  />
                </div>
              </div>

              <Input
                id="hotelZipCode"
                label="CEP (opcional)"
                placeholder="Ex: 95670000"
                value={hotelAddressParts.zipCode}
                onChange={(e) => {
                  const zip = e.target.value.replace(/\D/g, '').slice(0, 8);
                  setHotelAddressParts(prev => ({ ...prev, zipCode: zip }));
                }}
                maxLength={8}
              />

              {/* Preview do endereço formatado */}
              {formData.hotelAddress && (
                <div className="p-3 bg-surface rounded-lg border border-border">
                  <p className="text-xs font-semibold text-text-secondary mb-1">Endereço completo:</p>
                  <p className="text-sm text-text-primary font-medium">{formData.hotelAddress}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DatePicker
                id="hotelCheckin"
                label="Data de Check-in"
                value={formData.hotelCheckin || ''}
                onChange={(date) => handleChange('hotelCheckin', date)}
              />
              <DatePicker
                id="hotelCheckout"
                label="Data de Check-out"
                value={formData.hotelCheckout || ''}
                onChange={(date) => handleChange('hotelCheckout', date)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                id="hotelPhone"
                label="Telefone do Hotel"
                placeholder="Ex: (11) 1234-5678"
                value={formData.hotelPhone || ''}
                onChange={(e) => handleChange('hotelPhone', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">Observações</label>
              <textarea
                rows={4}
                className="w-full rounded-custom border border-border bg-white px-4 py-3 text-text-primary outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-text-disabled resize-none"
                placeholder="Informações adicionais sobre o hotel..."
                value={formData.hotelNotes || ''}
                onChange={(e) => handleChange('hotelNotes', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Seção Voo */}
        {activeSection === 'flight' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plane size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">Informações do Voo</h2>
                <p className="text-sm text-text-secondary">Cadastre os detalhes do seu voo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                id="flightCompany"
                label="Companhia Aérea"
                placeholder="Ex: LATAM, Gol, Azul"
                value={formData.flightCompany || ''}
                onChange={(e) => handleChange('flightCompany', e.target.value)}
              />
              <Input
                id="flightNumber"
                label="Número do Voo"
                placeholder="Ex: LA 1234"
                value={formData.flightNumber || ''}
                onChange={(e) => handleChange('flightNumber', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                id="flightConfirmationCode"
                label="Código de Confirmação"
                placeholder="Ex: ABC123"
                value={formData.flightConfirmationCode || ''}
                onChange={(e) => handleChange('flightConfirmationCode', e.target.value)}
              />
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Partida</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DatePicker
                  id="flightDepartureDate"
                  label="Data de Partida"
                  value={formData.flightDepartureDate || ''}
                  onChange={(date) => handleChange('flightDepartureDate', date)}
                />
                <Input
                  id="flightDepartureTime"
                  label="Horário de Partida"
                  type="time"
                  value={formData.flightDepartureTime || ''}
                  onChange={(e) => handleChange('flightDepartureTime', e.target.value)}
                />
                <Input
                  id="flightDepartureAirport"
                  label="Aeroporto de Partida"
                  placeholder="Ex: GRU - Guarulhos"
                  value={formData.flightDepartureAirport || ''}
                  onChange={(e) => handleChange('flightDepartureAirport', e.target.value)}
                />
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Chegada</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DatePicker
                  id="flightArrivalDate"
                  label="Data de Chegada"
                  value={formData.flightArrivalDate || ''}
                  onChange={(date) => handleChange('flightArrivalDate', date)}
                />
                <Input
                  id="flightArrivalTime"
                  label="Horário de Chegada"
                  type="time"
                  value={formData.flightArrivalTime || ''}
                  onChange={(e) => handleChange('flightArrivalTime', e.target.value)}
                />
                <Input
                  id="flightArrivalAirport"
                  label="Aeroporto de Chegada"
                  placeholder="Ex: SDU - Santos Dumont"
                  value={formData.flightArrivalAirport || ''}
                  onChange={(e) => handleChange('flightArrivalAirport', e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">Observações</label>
              <textarea
                rows={4}
                className="w-full rounded-custom border border-border bg-white px-4 py-3 text-text-primary outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-text-disabled resize-none"
                placeholder="Informações adicionais sobre o voo..."
                value={formData.flightNotes || ''}
                onChange={(e) => handleChange('flightNotes', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Seção Aluguel de Carro */}
        {activeSection === 'car' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Car size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">Aluguel de Carro</h2>
                <p className="text-sm text-text-secondary">Cadastre os dados do aluguel de carro</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                id="carRentalCompany"
                label="Empresa de Aluguel"
                placeholder="Ex: Localiza, Hertz, Movida"
                value={formData.carRentalCompany || ''}
                onChange={(e) => handleChange('carRentalCompany', e.target.value)}
              />
              <Input
                id="carRentalConfirmationCode"
                label="Código de Confirmação"
                placeholder="Ex: ABC123"
                value={formData.carRentalConfirmationCode || ''}
                onChange={(e) => handleChange('carRentalConfirmationCode', e.target.value)}
              />
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Retirada do Veículo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DatePicker
                  id="carRentalPickupDate"
                  label="Data de Retirada"
                  value={formData.carRentalPickupDate || ''}
                  onChange={(date) => handleChange('carRentalPickupDate', date)}
                />
                <Input
                  id="carRentalPickupTime"
                  label="Horário de Retirada"
                  type="time"
                  value={formData.carRentalPickupTime || ''}
                  onChange={(e) => handleChange('carRentalPickupTime', e.target.value)}
                />
                <Input
                  id="carRentalPickupLocation"
                  label="Local de Retirada"
                  placeholder="Ex: Aeroporto de Guarulhos - Terminal 1"
                  value={formData.carRentalPickupLocation || ''}
                  onChange={(e) => handleChange('carRentalPickupLocation', e.target.value)}
                />
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Devolução do Veículo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DatePicker
                  id="carRentalReturnDate"
                  label="Data de Devolução"
                  value={formData.carRentalReturnDate || ''}
                  onChange={(date) => handleChange('carRentalReturnDate', date)}
                />
                <Input
                  id="carRentalReturnTime"
                  label="Horário de Devolução"
                  type="time"
                  value={formData.carRentalReturnTime || ''}
                  onChange={(e) => handleChange('carRentalReturnTime', e.target.value)}
                />
                <Input
                  id="carRentalReturnLocation"
                  label="Local de Devolução"
                  placeholder="Ex: Aeroporto de Guarulhos - Terminal 1"
                  value={formData.carRentalReturnLocation || ''}
                  onChange={(e) => handleChange('carRentalReturnLocation', e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">Observações</label>
              <textarea
                rows={4}
                className="w-full rounded-custom border border-border bg-white px-4 py-3 text-text-primary outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-text-disabled resize-none"
                placeholder="Informações adicionais sobre o aluguel..."
                value={formData.carRentalNotes || ''}
                onChange={(e) => handleChange('carRentalNotes', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Seção Dados Pessoais */}
        {activeSection === 'personal' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <User size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">Meus Dados</h2>
                <p className="text-sm text-text-secondary">Atualize suas informações pessoais</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                id="personalName"
                label="Nome Completo"
                placeholder="Seu nome completo"
                value={formData.personalName || ''}
                onChange={(e) => handleChange('personalName', e.target.value)}
              />
              <Input
                id="personalEmail"
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                value={formData.personalEmail || ''}
                onChange={(e) => handleChange('personalEmail', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                id="personalPhone"
                label="Telefone"
                placeholder="Ex: (11) 98765-4321"
                value={formData.personalPhone || ''}
                onChange={(e) => handleChange('personalPhone', e.target.value)}
              />
              <Input
                id="personalDocument"
                label="CPF / Passaporte"
                placeholder="Ex: 123.456.789-00"
                value={formData.personalDocument || ''}
                onChange={(e) => handleChange('personalDocument', e.target.value)}
              />
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Contato de Emergência</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  id="personalEmergencyContact"
                  label="Nome do Contato"
                  placeholder="Nome da pessoa de contato"
                  value={formData.personalEmergencyContact || ''}
                  onChange={(e) => handleChange('personalEmergencyContact', e.target.value)}
                />
                <Input
                  id="personalEmergencyPhone"
                  label="Telefone de Emergência"
                  placeholder="Ex: (11) 98765-4321"
                  value={formData.personalEmergencyPhone || ''}
                  onChange={(e) => handleChange('personalEmergencyPhone', e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">Observações</label>
              <textarea
                rows={4}
                className="w-full rounded-custom border border-border bg-white px-4 py-3 text-text-primary outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-text-disabled resize-none"
                placeholder="Informações adicionais..."
                value={formData.personalNotes || ''}
                onChange={(e) => handleChange('personalNotes', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Seção Grupo Parceiro */}
        {activeSection === 'companion' && companionGroup && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                <Link size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary">Grupo Parceiro</h2>
                <p className="text-sm text-text-secondary">Informações da sua agenda compartilhada</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-lg flex-shrink-0">
                <Users size={40} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold text-amber-900 mb-1">{companionGroup.name}</h3>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-amber-800">
                  <div className="flex items-center gap-1.5 font-medium">
                    <User size={16} />
                    Líder: {companionGroup.leaderName}
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Users size={16} />
                    {companionGroup.membersCount} integrantes
                  </div>
                </div>
              </div>
              <div className="px-4 py-2 bg-white rounded-xl border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-wider shadow-sm">
                Agenda Conectada
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-white border border-border rounded-2xl shadow-sm">
                <h4 className="font-bold text-text-primary mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  O que isso significa?
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Vocês estão fazendo a viagem juntos! Sempre que o grupo <strong>{companionGroup.name}</strong> confirmar presença em um passeio oficial, ele aparecerá automaticamente na sua <strong>Agenda</strong> como uma sugestão marcada em amarelo.
                </p>
              </div>
              <div className="p-5 bg-white border border-border rounded-2xl shadow-sm">
                <h4 className="font-bold text-text-primary mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  Eu preciso confirmar?
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Sim! Mesmo com a agenda compartilhada, cada grupo precisa confirmar seus próprios participantes e realizar o pagamento individualmente. A sugestão apenas facilita para vocês ficarem juntos.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botão Salvar */}
        <div className="flex justify-end pt-6 mt-8 border-t border-surface">
          {activeSection !== 'companion' && (
            <Button
              onClick={handleSave}
              isLoading={isSaving}
              className="px-8"
            >
              <Save size={18} className="mr-2" />
              Salvar Alterações
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTripPage;
