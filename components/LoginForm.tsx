import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Info } from 'lucide-react';
import Input from './Input';
import Button from './Button';
import ForgotPasswordModal from './ForgotPasswordModal';
import { groupsApi, adminsApi } from '../lib/database';
import { verifyPassword } from '../lib/password';
import { UserRole, Group } from '../types';

interface LoginFormProps {
  onSuccess: (role: UserRole, group?: Group, adminData?: { email: string; password: string | null; passwordChanged?: boolean | null }) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '', 
    password: ''
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailTrimmed = formData.email?.trim() || '';
    
    if (!emailTrimmed) {
      newErrors.email = 'E-mail é obrigatório';
    } else {
      // Validação de email mais robusta
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailTrimmed)) {
        newErrors.email = 'Digite um e-mail válido';
      }
    }

    if (!formData.password || !formData.password.trim()) {
      newErrors.password = 'Senha é obrigatória';
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('🔍 [LoginForm] Validação:', isValid ? '✅ Válido' : '❌ Inválido', newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔵 [LoginForm] handleSubmit chamado', { isLoading, email: formData.email });
    
    // Prevenir múltiplos cliques - verificar ANTES da validação
    if (isLoading) {
      console.log('⚠️ [LoginForm] Já está carregando, ignorando clique');
      return;
    }

    if (!validate()) {
      console.log('❌ [LoginForm] Validação falhou');
      return;
    }

    console.log('✅ [LoginForm] Validação passou, iniciando login...');
    setIsLoading(true);
    setErrors({});
    
    try {
      const normalizedEmail = formData.email.toLowerCase().trim();
      const inputPassword = formData.password.trim();
      
      // Lista de fallback (caso a tabela admins não exista ainda)
      const fallbackAdminEmails = [
        'admin@travel.com',
        'raffiweran@gmail.com',
        'paulapgcferreira2@gmail.com'
      ];
      
      // Verificar se é admin (banco + fallback) - otimizado
      let isAdmin = false;
      let adminData: { email: string; password: string | null; passwordChanged?: boolean | null } | null = null;
      
      console.log('🔍 [LoginForm] Verificando se é admin...');
      try {
        isAdmin = await adminsApi.isAdmin(normalizedEmail);
        console.log('🔍 [LoginForm] Resultado isAdmin do banco:', isAdmin);
        if (isAdmin) {
          adminData = await adminsApi.getAdminByEmailWithPasswordChanged(normalizedEmail);
          console.log('👤 [LoginForm] Admin encontrado:', adminData ? 'Sim' : 'Não', adminData ? { hasPassword: !!adminData.password, passwordChanged: adminData.passwordChanged } : '');
        }
      } catch (error: any) {
        console.log('⚠️ [LoginForm] Erro ao verificar admin no banco:', error.message);
        // Se erro no banco, verifica fallback
        isAdmin = fallbackAdminEmails.some(email => email.toLowerCase().trim() === normalizedEmail);
        console.log('🔍 [LoginForm] Verificação fallback:', isAdmin);
      }
      
      // Se não encontrou no banco, verifica na lista de fallback
      if (!isAdmin) {
        isAdmin = fallbackAdminEmails.some(email => email.toLowerCase().trim() === normalizedEmail);
        console.log('🔍 [LoginForm] Verificação fallback final:', isAdmin);
      }
      
      if (isAdmin) {
        console.log('✅ [LoginForm] É admin, verificando senha...');
        // Verificar senha do admin - obrigatório se tiver senha cadastrada
        if (adminData && adminData.password) {
          const passwordMatch = verifyPassword(inputPassword, adminData.password.trim());
          console.log('🔐 [LoginForm] Senha admin:', passwordMatch ? 'Correta' : 'Incorreta');
          if (!passwordMatch) {
            setErrors({ general: 'Usuário não encontrado ou senha incorreta.' });
            setIsLoading(false);
            return;
          }
        } else if (fallbackAdminEmails.includes(normalizedEmail)) {
          // Admin na lista de fallback sem senha no banco - permite login sem senha
          console.log('⚠️ [LoginForm] Admin fallback sem senha cadastrada, permitindo login');
        } else {
          // Admin no banco mas sem senha - requer senha
          setErrors({ general: 'Usuário não encontrado ou senha incorreta.' });
          setIsLoading(false);
          return;
        }
        // Login como admin - passar dados do admin para verificar se precisa alterar senha
        console.log('🚀 [LoginForm] Chamando onSuccess para admin', { adminData });
        onSuccess('admin', undefined, adminData || { email: normalizedEmail, password: null, passwordChanged: false });
        setIsLoading(false);
        return;
      }

      // Buscar grupo específico por email (otimizado - não busca todos)
      // Primeiro tenta buscar diretamente se houver API para isso
      // Se não, busca todos mas apenas uma vez
      console.log('🔍 [LoginForm] Buscando grupo para email:', normalizedEmail);
      const allGroups = await groupsApi.getAll();
      console.log('📋 [LoginForm] Total de grupos encontrados:', allGroups.length);
      const userGroup = allGroups.find(g => {
        if (!g.leaderEmail) return false;
        return g.leaderEmail.toLowerCase().trim() === normalizedEmail;
      });
      
      if (userGroup) {
        console.log('✅ [LoginForm] Grupo encontrado:', userGroup.name);
        // Verificar senha se o grupo tiver senha
        if (userGroup.leaderPassword) {
          const passwordMatch = verifyPassword(inputPassword, userGroup.leaderPassword.trim());
          console.log('🔐 [LoginForm] Senha grupo:', passwordMatch ? 'Correta' : 'Incorreta');
          if (!passwordMatch) {
            setErrors({ general: 'Usuário não encontrado ou senha incorreta.' });
            setIsLoading(false);
            return;
          }
        }
        
        // Login como usuário
        console.log('🚀 [LoginForm] Chamando onSuccess para usuário');
        onSuccess('user', userGroup);
        setIsLoading(false);
        return;
      }
      
      // Não encontrado
      console.log('❌ [LoginForm] Usuário não encontrado');
      setErrors({ general: 'Usuário não encontrado ou senha incorreta.' });
      setIsLoading(false);
    } catch (error: any) {
      console.error('❌ [LoginForm] Erro no login:', error);
      setErrors({ general: 'Erro ao fazer login. Tente novamente.' });
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors] || errors.general) {
      setErrors(prev => ({ ...prev, [name]: undefined, general: undefined }));
    }
  };


  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl sm:rounded-[24px] shadow-lg border border-border w-full relative overflow-hidden">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <img 
            src="/assets/logo.svg?v=2" 
            alt="Roteirando" 
            className="h-8 object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Bem-vindo!</h1>
        <p className="text-text-secondary">
          Acesse para gerenciar suas viagens
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {errors.general && (
            <div className="bg-status-error/10 text-status-error text-sm p-3 rounded-lg flex items-center gap-2">
                <Info size={16} />
                {errors.general}
            </div>
        )}

        <Input
          id="email"
          name="email"
          type="text"
          inputMode="email"
          autoComplete="email"
          label="E-mail"
          placeholder="exemplo@email.com"
          icon={Mail}
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />

        <div>
          <Input
            id="password"
            name="password"
            type="password"
            label="Senha"
            placeholder="••••••••"
            icon={Lock}
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
          />
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(true)}
              className="text-sm font-medium text-primary hover:text-primary-hover transition-colors duration-200"
            >
              Esqueceu a senha?
            </button>
          </div>
        </div>

        <Button 
          type="submit" 
          fullWidth 
          isLoading={isLoading}
          disabled={isLoading}
          onClick={(e) => {
            console.log('🖱️ [LoginForm] Botão clicado', { isLoading });
            // Garantir que o form seja submetido mesmo se houver algum problema
            if (!isLoading && formData.email && formData.password) {
              // Deixar o form.handleSubmit fazer o trabalho
            } else {
              console.log('⚠️ [LoginForm] Clique ignorado - condições não atendidas', {
                isLoading,
                hasEmail: !!formData.email,
                hasPassword: !!formData.password
              });
            }
          }}
        >
          {isLoading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        onSuccess={() => {
          setShowForgotPasswordModal(false);
          alert('Senha redefinida com sucesso! Você pode fazer login agora.');
        }}
      />
    </div>
  );
};

export default LoginForm;