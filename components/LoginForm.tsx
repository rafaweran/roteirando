import React, { useState } from 'react';
import { Mail, Lock, LogIn, ArrowRight, Info } from 'lucide-react';
import Input from './Input';
import Button from './Button';
import { MOCK_GROUPS } from '../data';
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
    
    setTimeout(() => {
      setIsLoading(false);

      // 1. Check for Admin
      if (formData.email === 'admin@travel.com') {
        onSuccess('admin');
        return;
      }

      // 2. Check for Group Leader (User)
      const userGroup = MOCK_GROUPS.find(g => g.leaderEmail === formData.email);
      
      if (userGroup) {
        onSuccess('user', userGroup);
      } else {
        setErrors({ general: 'Usuário não encontrado ou senha incorreta.' });
      }
    }, 1000);
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