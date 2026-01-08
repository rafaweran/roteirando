import React, { useState } from 'react';
import { Mail, Lock, LogIn, ArrowRight, Info } from 'lucide-react';
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
      
      // Verificar no banco de dados
      const { adminsApi } = await import('../lib/database');
      const isAdminInDB = await adminsApi.isAdmin(normalizedEmail);
      
      // Se não encontrou no banco, verifica na lista de fallback
      const isAdmin = isAdminInDB || fallbackAdminEmails.some(email => email.toLowerCase().trim() === normalizedEmail);
      
      if (isAdmin) {
        // In a real app, you would verify the password here
        console.log('✅ Login como administrador:', normalizedEmail);
        onSuccess('admin');
        setIsLoading(false);
        return;
      }

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
        // Verificar senha
        if (!userGroup.leaderPassword) {
          setErrors({ general: 'Este usuário não possui senha cadastrada. Entre em contato com o administrador.' });
          return;
        }
        
        const passwordValid = verifyPassword(formData.password, userGroup.leaderPassword);
        
        if (!passwordValid) {
          setErrors({ general: 'Senha incorreta. Verifique suas credenciais.' });
          return;
        }
        
        console.log('✅ Login bem-sucedido para usuário:', userGroup.leaderName);
        console.log('📊 Dados do grupo no login:', {
          id: userGroup.id,
          name: userGroup.name,
          leaderEmail: userGroup.leaderEmail,
          passwordChanged: userGroup.passwordChanged,
          typeof: typeof userGroup.passwordChanged,
          hasPasswordChanged: userGroup.passwordChanged !== undefined,
          needsChange: userGroup.passwordChanged !== true,
        });
        
        // Recarregar o grupo do banco para garantir dados atualizados
        console.log('='.repeat(60));
        console.log('🔄 Recarregando grupo do banco...');
        console.log('='.repeat(60));
        
        try {
          const { groupsApi } = await import('../lib/database');
          const freshGroup = await groupsApi.getById(userGroup.id);
          
          if (freshGroup) {
            console.log('✅ Grupo recarregado com sucesso!');
            console.log('📦 Dados do grupo do banco:', JSON.stringify(freshGroup, null, 2));
            console.log('🔍 Campo passwordChanged do banco:', {
              valor: freshGroup.passwordChanged,
              tipo: typeof freshGroup.passwordChanged,
              isTrue: freshGroup.passwordChanged === true,
              isFalse: freshGroup.passwordChanged === false,
              isUndefined: freshGroup.passwordChanged === undefined,
            });
            console.log('='.repeat(60));
            console.log('📞 Chamando onSuccess com grupo recarregado...');
            console.log('='.repeat(60));
            onSuccess('user', freshGroup);
          } else {
            console.log('⚠️ Grupo não encontrado no banco, usando dados do cache');
            console.log('📞 Chamando onSuccess com grupo do cache...');
            onSuccess('user', userGroup);
          }
        } catch (error) {
          console.error('❌ ERRO ao recarregar grupo:', error);
          console.log('📞 Usando dados do cache devido ao erro...');
          // Usar dados do cache se falhar
          onSuccess('user', userGroup);
        }
      } else {
        // More helpful error message
        if (allGroups.length === 0) {
          setErrors({ general: 'Nenhum grupo cadastrado no sistema. Entre em contato com o administrador.' });
        } else {
          const availableEmails = allGroups
            .filter(g => g.leaderEmail)
            .map(g => g.leaderEmail)
            .join(', ');
          setErrors({ general: `Usuário não encontrado. Verifique se o e-mail "${formData.email}" está cadastrado como líder de um grupo.${availableEmails ? ` Emails cadastrados: ${availableEmails}` : ''}` });
        }
      }
    } catch (err: any) {
      setErrors({ general: 'Erro ao fazer login. Tente novamente.' });
      console.error('Login error:', err);
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

  const fillCredentials = (type: 'admin' | 'user') => {
    if (type === 'admin') {
        setFormData({ email: 'admin@travel.com', password: 'password123' });
    } else {
        setFormData({ email: 'roberto@email.com', password: 'password123' });
    }
    setErrors({});
  };

  return (
    <div className="bg-white p-8 rounded-[24px] shadow-lg border border-border w-full relative overflow-hidden">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
          <LogIn className="text-primary w-6 h-6" />
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

      {/* Demo Helpers */}
      <div className="mt-8 pt-6 border-t border-border">
         <p className="text-xs text-text-disabled text-center mb-3 uppercase tracking-wider font-semibold">Login Rápido (Demo)</p>
         <div className="grid grid-cols-2 gap-3">
            <button onClick={() => fillCredentials('admin')} className="text-xs py-2 px-3 bg-surface hover:bg-primary/5 border border-border rounded-lg text-text-secondary transition-colors">
                Admin
            </button>
            <button onClick={() => fillCredentials('user')} className="text-xs py-2 px-3 bg-surface hover:bg-primary/5 border border-border rounded-lg text-text-secondary transition-colors">
                Usuário (Roberto)
            </button>
         </div>
      </div>
    </div>
  );
};

export default LoginForm;