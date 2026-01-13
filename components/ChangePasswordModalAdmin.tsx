import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { hashPassword, verifyPassword } from '../lib/password';
import { adminsApi } from '../lib/database';
import Button from './Button';

interface ChangePasswordModalAdminProps {
  isOpen: boolean;
  adminEmail: string;
  currentPasswordHash: string | null; // Hash da senha atual no banco
  onSuccess: () => void;
  onCancel?: () => void;
}

const ChangePasswordModalAdmin: React.FC<ChangePasswordModalAdminProps> = ({ 
  isOpen, 
  adminEmail,
  currentPasswordHash,
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

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    // Verificar senha atual usando hash
    if (currentPasswordHash) {
      const passwordMatch = verifyPassword(formData.currentPassword, currentPasswordHash);
      if (!passwordMatch) {
        newErrors.currentPassword = 'Senha atual incorreta';
      }
    } else {
      // Se não tem hash, aceitar qualquer senha (primeiro acesso)
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Senha atual é obrigatória';
      }
    }

    // Validar nova senha
    if (!formData.newPassword) {
      newErrors.newPassword = 'Nova senha é obrigatória';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'A senha deve ter no mínimo 8 caracteres';
    }

    // Validar confirmação
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
      // Hash da nova senha
      const hashedPassword = hashPassword(formData.newPassword);

      // Atualizar senha no banco
      await adminsApi.updateAdminPassword(adminEmail, hashedPassword);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl sm:rounded-[24px] shadow-2xl w-full max-w-md mx-4 sm:mx-auto relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Lock className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Primeiro Acesso</h2>
              <p className="text-sm text-text-secondary mt-1">Altere sua senha inicial</p>
            </div>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-status-error/10 border border-status-error/30 rounded-lg text-status-error text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-text-primary mb-2">
                Senha Atual
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => handleChange('currentPassword', e.target.value)}
                  className={`w-full h-12 rounded-custom border bg-white px-4 pr-12 transition-all duration-200 text-text-primary outline-none ${
                    errors.currentPassword
                      ? 'border-status-error focus:border-status-error focus:ring-1 focus:ring-status-error'
                      : 'border-border hover:border-primary-light focus:border-primary focus:ring-2 focus:ring-primary/20'
                  }`}
                  placeholder="Digite a senha atual"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.currentPassword && (
                <span className="text-xs text-status-error mt-1 block">{errors.currentPassword}</span>
              )}
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-text-primary mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => handleChange('newPassword', e.target.value)}
                  className={`w-full h-12 rounded-custom border bg-white px-4 pr-12 transition-all duration-200 text-text-primary outline-none ${
                    errors.newPassword
                      ? 'border-status-error focus:border-status-error focus:ring-1 focus:ring-status-error'
                      : 'border-border hover:border-primary-light focus:border-primary focus:ring-2 focus:ring-primary/20'
                  }`}
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.newPassword && (
                <span className="text-xs text-status-error mt-1 block">{errors.newPassword}</span>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className={`w-full h-12 rounded-custom border bg-white px-4 pr-12 transition-all duration-200 text-text-primary outline-none ${
                    errors.confirmPassword
                      ? 'border-status-error focus:border-status-error focus:ring-1 focus:ring-status-error'
                      : 'border-border hover:border-primary-light focus:border-primary focus:ring-2 focus:ring-primary/20'
                  }`}
                  placeholder="Digite a nova senha novamente"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="text-xs text-status-error mt-1 block">{errors.confirmPassword}</span>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
                className="min-h-[52px] sm:h-11 text-base sm:text-sm font-semibold"
              >
                Alterar Senha
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModalAdmin;
