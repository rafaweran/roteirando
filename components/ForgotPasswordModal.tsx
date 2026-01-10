import React, { useState } from 'react';
import { X, Mail, ArrowRight, Info, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { groupsApi } from '../lib/database';
import { sendPasswordResetEmail } from '../lib/email';
import { hashPassword } from '../lib/password';
import Input from './Input';
import Button from './Button';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'email' | 'reset' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; code?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Digite um e-mail válido' });
      return;
    }

    setIsLoading(true);
    try {
      // Buscar grupo pelo email ou admin
      const normalizedEmail = email.toLowerCase().trim();
      
      // Verificar se é admin primeiro
      let isAdmin = false;
      let adminData = null;
      try {
        const { adminsApi } = await import('../lib/database');
        isAdmin = await adminsApi.isAdmin(normalizedEmail);
        if (isAdmin) {
          adminData = await adminsApi.getAdminByEmail(normalizedEmail);
          console.log('✅ Email encontrado como ADMIN:', normalizedEmail);
        }
      } catch (error) {
        console.warn('⚠️ Erro ao verificar admin:', error);
      }
      
      // Buscar grupo pelo email
      const allGroups = await groupsApi.getAll();
      
      // Debug: log todos os emails encontrados
      console.log('🔍 Buscando email para reset:', normalizedEmail);
      console.log('📋 Total de grupos:', allGroups.length);
      console.log('👤 É admin?', isAdmin);
      
      // Debug detalhado de cada grupo
      allGroups.forEach((g, index) => {
        console.log(`📧 Grupo ${index + 1}:`, {
          id: g.id,
          name: g.name,
          leaderName: g.leaderName,
          leaderEmail: g.leaderEmail,
          leaderEmailType: typeof g.leaderEmail,
          leaderEmailExists: !!g.leaderEmail,
          leaderEmailLower: g.leaderEmail?.toLowerCase().trim(),
          match: g.leaderEmail?.toLowerCase().trim() === normalizedEmail
        });
      });
      
      const groupsWithEmail = allGroups.filter(g => 
        g.leaderEmail && typeof g.leaderEmail === 'string' && g.leaderEmail.trim() !== ''
      );
      
      console.log('📧 Emails encontrados nos grupos:', groupsWithEmail.map(g => ({
        name: g.name,
        email: g.leaderEmail,
        emailLower: g.leaderEmail?.toLowerCase().trim(),
        match: g.leaderEmail?.toLowerCase().trim() === normalizedEmail
      })));
      
      console.log(`📊 Grupos com email válido: ${groupsWithEmail.length} de ${allGroups.length}`);
      
      const userGroup = allGroups.find(g => {
        // Verificar se leaderEmail existe e não está vazio
        if (!g.leaderEmail || typeof g.leaderEmail !== 'string' || g.leaderEmail.trim() === '') {
          return false;
        }
        const groupEmail = g.leaderEmail.toLowerCase().trim();
        const match = groupEmail === normalizedEmail;
        if (match) {
          console.log(`✅ Grupo encontrado: "${g.name}" com email "${g.leaderEmail}"`);
        }
        return match;
      });

      // Se não encontrou nem como grupo nem como admin
      if (!userGroup && !isAdmin) {
        console.log('❌ Email não encontrado no sistema (nem grupo nem admin):', normalizedEmail);
        setErrors({ email: 'E-mail não encontrado no sistema.' });
        setIsLoading(false);
        return;
      }

      // Determinar dados do usuário (grupo ou admin)
      const userName = userGroup ? userGroup.leaderName : (adminData?.email.split('@')[0] || 'Usuário');
      const userType = userGroup ? 'grupo' : 'admin';
      const groupName = userGroup ? userGroup.name : 'Administrador';

      // Gerar código de reset (6 dígitos)
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      
      // Guardar tipo de usuário para uso posterior
      const resetUserData = {
        email: email,
        isAdmin: isAdmin,
        groupId: userGroup?.id,
        adminId: adminData ? 'admin' : null
      };
      sessionStorage.setItem('passwordResetUser', JSON.stringify(resetUserData));

      // Enviar email com código
      const emailSent = await sendPasswordResetEmail({
        email: email,
        leaderName: userName,
        resetCode: code,
        groupName: groupName
      });

      if (emailSent) {
        setStep('reset');
        alert('Código de recuperação enviado para seu e-mail!');
      } else {
        setErrors({ general: 'Erro ao enviar e-mail. Tente novamente.' });
      }
    } catch (error: any) {
      console.error('Erro ao processar reset de senha:', error);
      setErrors({ general: 'Erro ao processar solicitação. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!resetCode || resetCode.length !== 6) {
      setErrors({ code: 'Código inválido. Digite os 6 dígitos.' });
      return;
    }

    if (resetCode !== generatedCode) {
      setErrors({ code: 'Código incorreto. Verifique o código enviado para seu e-mail.' });
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setErrors({ password: 'A senha deve ter no mínimo 8 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors({ password: 'As senhas não coincidem.' });
      return;
    }

    setIsLoading(true);
    try {
      // Recuperar dados do usuário do sessionStorage
      const resetUserDataStr = sessionStorage.getItem('passwordResetUser');
      if (!resetUserDataStr) {
        setErrors({ general: 'Erro: sessão expirada. Tente novamente.' });
        setIsLoading(false);
        return;
      }
      
      const resetUserData = JSON.parse(resetUserDataStr);
      const normalizedEmail = resetUserData.email.toLowerCase().trim();
      
      // Atualizar senha
      const hashedPassword = hashPassword(newPassword);
      
      if (resetUserData.isAdmin) {
        // Atualizar senha do admin
        const { adminsApi } = await import('../lib/database');
        const adminData = await adminsApi.getAdminByEmail(normalizedEmail);
        
        if (!adminData) {
          setErrors({ general: 'Erro: administrador não encontrado.' });
          setIsLoading(false);
          return;
        }
        
        // Atualizar senha do admin na tabela admins
        const { supabase } = await import('../lib/supabase');
        const { error } = await supabase
          .from('admins')
          .update({ password: hashedPassword })
          .eq('email', normalizedEmail);
        
        if (error) {
          console.error('❌ Erro ao atualizar senha do admin:', error);
          setErrors({ general: 'Erro ao atualizar senha. Tente novamente.' });
          setIsLoading(false);
          return;
        }
        
        console.log('✅ Senha do admin atualizada com sucesso');
      } else {
        // Atualizar senha do grupo
        if (!resetUserData.groupId) {
          setErrors({ general: 'Erro: grupo não encontrado.' });
          setIsLoading(false);
          return;
        }
        
        await groupsApi.updatePassword(resetUserData.groupId, hashedPassword);
        console.log('✅ Senha do grupo atualizada com sucesso');
      }

      setStep('success');
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
        // Resetar estado
        setStep('email');
        setEmail('');
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
        setGeneratedCode('');
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao resetar senha:', error);
      setErrors({ general: 'Erro ao resetar senha. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('email');
    setEmail('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    setGeneratedCode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] shadow-xl border border-border w-full max-w-md p-8 relative animate-in zoom-in-95 duration-200">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-text-secondary hover:text-text-primary hover:bg-surface rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        {step === 'email' && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={32} className="text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Esqueceu a senha?</h2>
              <p className="text-text-secondary">
                Digite seu e-mail e enviaremos um código de recuperação
              </p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {errors.general && (
                <div className="bg-status-error/10 text-status-error text-sm p-3 rounded-lg flex items-center gap-2">
                  <Info size={16} />
                  {errors.general}
                </div>
              )}

              <Input
                id="email"
                name="email"
                type="email"
                label="E-mail"
                placeholder="seu@email.com"
                icon={Mail}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                error={errors.email}
                required
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="flex-1"
                >
                  Enviar Código
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              </div>
            </form>
          </>
        )}

        {step === 'reset' && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={32} className="text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Redefinir Senha</h2>
              <p className="text-text-secondary">
                Digite o código enviado para <strong>{email}</strong>
              </p>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-4">
              {errors.general && (
                <div className="bg-status-error/10 text-status-error text-sm p-3 rounded-lg flex items-center gap-2">
                  <Info size={16} />
                  {errors.general}
                </div>
              )}

              <div>
                <label htmlFor="resetCode" className="block text-sm font-medium text-text-primary mb-2">
                  Código de Verificação
                </label>
                <Input
                  id="resetCode"
                  name="resetCode"
                  type="text"
                  placeholder="000000"
                  value={resetCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setResetCode(value);
                    if (errors.code) setErrors({ ...errors, code: undefined });
                  }}
                  error={errors.code}
                  required
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Digite os 6 dígitos enviados para seu e-mail
                </p>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-text-primary mb-2">
                  Nova Senha
                </label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    error={errors.password}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
                  Confirmar Nova Senha
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite a senha novamente"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  error={errors.password}
                  required
                  minLength={8}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep('email');
                    setResetCode('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setErrors({});
                  }}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="flex-1"
                >
                  Redefinir Senha
                </Button>
              </div>
            </form>
          </>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-status-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-status-success" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Senha Redefinida!</h2>
            <p className="text-text-secondary mb-6">
              Sua senha foi redefinida com sucesso. Você será redirecionado...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
