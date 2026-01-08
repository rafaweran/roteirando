import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Group } from '../types';
import { hashPassword } from '../lib/password';
import { groupsApi } from '../lib/database';
import Button from './Button';

interface ChangePasswordModalProps {
  isOpen: boolean;
  group: Group;
  onSuccess: () => void;
  onCancel?: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ 
  isOpen, 
  group, 
  onSuccess,
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Debug: log quando o componente renderiza
  React.useEffect(() => {
    console.log('='.repeat(60));
    console.log('🎉 ChangePasswordModal useEffect TRIGGERED');
    console.log('='.repeat(60));
    console.log('📋 Props recebidas:', {
      isOpen,
      groupId: group?.id,
      groupName: group?.name,
      leaderEmail: group?.leaderEmail,
      passwordChanged: group?.passwordChanged,
      timestamp: new Date().toISOString(),
    });
    
    if (isOpen) {
      console.log('✅ isOpen = true - Modal DEVE estar visível!');
    } else {
      console.log('❌ isOpen = false - Modal NÃO está aberto');
    }
    console.log('='.repeat(60));
  }, [isOpen, group]);

  // Debug: log antes do return
  console.log('🔄 ChangePasswordModal render - isOpen:', isOpen, 'timestamp:', new Date().toISOString());

  if (!isOpen) {
    console.log('⏸️ ChangePasswordModal retornando NULL porque isOpen = false');
    return null;
  }

  console.log('✅ ChangePasswordModal renderizando conteúdo do modal - DEVE ESTAR VISÍVEL AGORA!');

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    // Senha atual só é obrigatória se não for o primeiro acesso
    if (group.passwordChanged && !formData.currentPassword) {
      newErrors.currentPassword = 'Senha atual é obrigatória';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Nova senha é obrigatória';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'A senha deve ter pelo menos 8 caracteres';
    } else if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = 'A nova senha deve ser diferente da senha atual';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Verificar senha atual apenas se já tiver alterado antes (não é primeiro acesso)
      if (group.passwordChanged) {
        if (!formData.currentPassword) {
          setErrors({ currentPassword: 'Senha atual é obrigatória' });
          setIsLoading(false);
          return;
        }
        
        if (group.leaderPassword) {
          const { verifyPassword } = await import('../lib/password');
          const currentPasswordValid = verifyPassword(formData.currentPassword, group.leaderPassword);
          
          if (!currentPasswordValid) {
            setErrors({ currentPassword: 'Senha atual incorreta' });
            setIsLoading(false);
            return;
          }
        }
      }

      // Hash da nova senha
      const hashedPassword = hashPassword(formData.newPassword);

      // Atualizar senha no banco
      await groupsApi.updatePassword(group.id, hashedPassword);

      // Limpar formulário
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Chamar callback de sucesso
      onSuccess();
    } catch (error: any) {
      setErrors({ general: error.message || 'Erro ao alterar senha. Tente novamente.' });
      console.error('Error changing password:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field] || errors.general) {
      setErrors(prev => ({ ...prev, [field]: undefined, general: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Lock className="text-primary" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-text-primary mb-2">
                {group.passwordChanged ? 'Alterar Senha' : 'Primeiro Acesso - Alterar Senha'}
              </h3>
              {!group.passwordChanged && (
                <div className="bg-status-warning/10 border border-status-warning/20 rounded-lg p-3 flex items-start gap-2 mt-3">
                  <AlertCircle size={16} className="text-status-warning flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-text-secondary">
                    Por segurança, você deve alterar sua senha inicial antes de continuar.
                  </p>
                </div>
              )}
            </div>
          </div>

          {errors.general && (
            <div className="bg-status-error/10 text-status-error text-sm p-3 rounded-lg flex items-center gap-2 mb-4">
              <AlertCircle size={16} />
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {group.passwordChanged && (
              <div>
                <label htmlFor="currentPassword" className="text-sm font-medium text-text-primary mb-1.5 block">
                  Senha Atual
                </label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={formData.currentPassword}
                    onChange={(e) => handleChange('currentPassword', e.target.value)}
                    className={`
                      w-full h-[48px] rounded-custom border bg-white px-4 pr-10 transition-all duration-200
                      placeholder:text-text-disabled text-text-primary outline-none
                      ${errors.currentPassword 
                        ? 'border-status-error focus:border-status-error focus:ring-1 focus:ring-status-error' 
                        : 'border-border hover:border-primary-light focus:border-primary focus:ring-2 focus:ring-primary/20'
                      }
                    `}
                    placeholder="Digite sua senha atual"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-status-error text-xs mt-1">{errors.currentPassword}</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="text-sm font-medium text-text-primary mb-1.5 block">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => handleChange('newPassword', e.target.value)}
                  className={`
                    w-full h-[48px] rounded-custom border bg-white px-4 pr-10 transition-all duration-200
                    placeholder:text-text-disabled text-text-primary outline-none
                    ${errors.newPassword 
                      ? 'border-status-error focus:border-status-error focus:ring-1 focus:ring-status-error' 
                      : 'border-border hover:border-primary-light focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }
                  `}
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-status-error text-xs mt-1">{errors.newPassword}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="text-sm font-medium text-text-primary mb-1.5 block">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className={`
                    w-full h-[48px] rounded-custom border bg-white px-4 pr-10 transition-all duration-200
                    placeholder:text-text-disabled text-text-primary outline-none
                    ${errors.confirmPassword 
                      ? 'border-status-error focus:border-status-error focus:ring-1 focus:ring-status-error' 
                      : 'border-border hover:border-primary-light focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }
                  `}
                  placeholder="Digite a senha novamente"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-status-error text-xs mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-surface mt-6">
              {onCancel && !group.passwordChanged && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              )}
              <Button
                type="submit"
                isLoading={isLoading}
                className={onCancel && !group.passwordChanged ? 'flex-1' : 'w-full'}
              >
                {isLoading ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;

