import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Info } from 'lucide-react';
import Input from './Input';
import Button from './Button';
import ForgotPasswordModal from './ForgotPasswordModal';
import { groupsApi } from '../lib/database';
import { verifyPassword } from '../lib/password';
import { UserRole, Group } from '../types';

interface LoginFormProps {
  onSuccess: (role: UserRole, group?: Group) => void;
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
    
    if (!formData.email) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Digite um e-mail válido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
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
      // 1. Check for Admin
      // Primeiro verifica no banco de dados, depois fallback para lista hardcoded
      const normalizedEmail = formData.email.toLowerCase().trim();
      
      // Lista de fallback (caso a tabela admins não exista ainda)
      const fallbackAdminEmails = [
        'admin@travel.com',
        'raffiweran@gmail.com'
      ];
      
      // Verificar no banco de dados (com tratamento de erro robusto)
      console.log('🔍 Verificando se é administrador:', normalizedEmail);
      let isAdminInDB = false;
      try {
        const { adminsApi } = await import('../lib/database');
        isAdminInDB = await adminsApi.isAdmin(normalizedEmail);
        console.log('📊 Resultado da verificação no banco:', isAdminInDB);
      } catch (error: any) {
        console.warn('⚠️ Erro ao verificar admin no banco (usando fallback):', error?.message || error);
        // Em caso de erro, continuamos com o fallback
        isAdminInDB = false;
      }
      
      // Se não encontrou no banco, verifica na lista de fallback
      const isFallbackAdmin = fallbackAdminEmails.some(email => email.toLowerCase().trim() === normalizedEmail);
      console.log('📋 É admin na lista de fallback:', isFallbackAdmin);
      
      const isAdmin = isAdminInDB || isFallbackAdmin;
      console.log('✅ É administrador?', isAdmin, `(banco: ${isAdminInDB}, fallback: ${isFallbackAdmin})`);
      
      if (isAdmin) {
        // Verificar senha do admin
        const { adminsApi } = await import('../lib/database');
        let adminData = null;
        
        try {
          adminData = await adminsApi.getAdminByEmail(normalizedEmail);
        } catch (error) {
          console.warn('⚠️ Erro ao buscar dados do admin:', error);
        }
        
        if (adminData && adminData.password) {
          // Admin no banco com senha configurada - validar senha
          const inputPassword = formData.password.trim();
          const storedHash = adminData.password.trim();
          
          // Debug: log para verificar o que está sendo comparado
          console.log('🔐 Validação de senha admin:', {
            email: normalizedEmail,
            inputPasswordLength: inputPassword.length,
            storedHashLength: storedHash.length,
            inputHash: btoa(inputPassword),
            storedHash: storedHash
          });
          
          const passwordMatch = verifyPassword(inputPassword, storedHash);
          console.log('✅ Resultado da validação:', passwordMatch);
          
          if (!passwordMatch) {
            setErrors({ general: 'Usuário não encontrado ou senha incorreta.' });
            setIsLoading(false);
            return;
          }
        } else if (adminData && !adminData.password) {
          // Admin no banco mas sem senha configurada - permitir login SEM senha (temporário)
          console.log('⚠️ Admin encontrado no banco mas sem senha configurada - permitindo login sem senha');
          console.log('✅ Login como administrador (sem senha):', normalizedEmail);
          onSuccess('admin');
          setIsLoading(false);
          return;
        } else {
          // Admin não encontrado no banco mas está na lista de fallback
          // Permitir login sem senha para admins de fallback (temporário até configurar senha)
          console.log('⚠️ Admin de fallback - permitindo login sem senha:', normalizedEmail);
          console.log('✅ Login como administrador (fallback, sem senha):', normalizedEmail);
          onSuccess('admin');
          setIsLoading(false);
          return;
        }
        
        console.log('✅ Login como administrador:', normalizedEmail);
        onSuccess('admin');
        setIsLoading(false);
        return;
      }
      
      console.log('❌ Não é administrador, continuando verificação de usuário...');

      // 2. Check for Group Leader (User) in database
      const allGroups = await groupsApi.getAll();
      
      // Debug: log groups and emails
      console.log('Total grupos encontrados:', allGroups.length);
      console.log('Emails dos líderes:', allGroups.map(g => g.leaderEmail));
      console.log('Email buscado:', formData.email);
      
      // Case-insensitive email comparison and trim whitespace
      // normalizedEmail já foi declarado acima, reutilizando aqui
      const userGroup = allGroups.find(g => {
        if (!g.leaderEmail) {
          console.log(`Grupo "${g.name}" não tem leaderEmail`);
          return false;
        }
        const match = g.leaderEmail.toLowerCase().trim() === normalizedEmail;
        if (match) {
          console.log(`Grupo encontrado: "${g.name}" com email "${g.leaderEmail}"`);
        }
        return match;
      });
      
      if (userGroup) {
        // Verificar senha se o grupo tiver senha
        if (userGroup.leaderPassword) {
          const inputPassword = formData.password.trim();
          const storedHash = userGroup.leaderPassword.trim();
          
          // Debug: log para verificar o que está sendo comparado
          console.log('🔐 Validação de senha grupo:', {
            email: normalizedEmail,
            groupName: userGroup.name,
            inputPasswordLength: inputPassword.length,
            storedHashLength: storedHash.length,
            inputHash: btoa(inputPassword),
            storedHash: storedHash
          });
          
          const passwordMatch = verifyPassword(inputPassword, storedHash);
          console.log('✅ Resultado da validação:', passwordMatch);
          
          if (!passwordMatch) {
            setErrors({ general: 'Usuário não encontrado ou senha incorreta.' });
            setIsLoading(false);
            return;
          }
        }
        
        // Se chegou aqui, senha está correta ou grupo não tem senha
        onSuccess('user', userGroup);
      } else {
        setErrors({ general: 'Usuário não encontrado ou senha incorreta.' });
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      setErrors({ general: 'Erro ao fazer login. Tente novamente.' });
    } finally {
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
    <div className="bg-white p-8 rounded-[24px] shadow-lg border border-border w-full relative overflow-hidden">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <img 
            src="/assets/logo.svg" 
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

      <form onSubmit={handleSubmit} className="space-y-6">
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