import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Info } from 'lucide-react';
import Input from './Input';
import Button from './Button';
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
        // In a real app, you would verify the password here
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
          const passwordMatch = verifyPassword(formData.password, userGroup.leaderPassword);
          if (!passwordMatch) {
            setErrors({ general: 'Usuário não encontrado ou senha incorreta.' });
            setIsLoading(false);
            return;
          }
        }
        
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
        <img 
          src="/assets/logo.png" 
          alt="Roteirando" 
          className="h-24 w-24 mx-auto mb-4 object-contain"
        />
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
            <a 
              href="#" 
              className="text-sm font-medium text-primary hover:text-primary-hover transition-colors duration-200"
            >
              Esqueceu a senha?
            </a>
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
    </div>
  );
};

export default LoginForm;