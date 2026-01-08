import React, { useState } from 'react';
import { Eye, EyeOff, LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  id: string;
}

const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  icon: Icon, 
  id,
  type = 'text',
  className = '',
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label 
          htmlFor={id} 
          className={`text-sm font-medium transition-colors duration-200 ${
            error ? 'text-status-error' : isFocused ? 'text-primary' : 'text-text-primary'
          }`}
        >
          {label}
        </label>
      )}
      
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
            <Icon size={20} className={`${isFocused ? 'text-primary' : 'text-text-secondary'} transition-colors duration-200`} />
          </div>
        )}
        
        <input
          id={id}
          type={inputType}
          className={`
            w-full h-[48px] rounded-custom border bg-white px-4 transition-all duration-200
            placeholder:text-text-disabled text-text-primary outline-none
            ${Icon ? 'pl-10' : ''}
            ${isPassword ? 'pr-10' : ''}
            ${error 
              ? 'border-status-error focus:border-status-error focus:ring-1 focus:ring-status-error' 
              : 'border-border hover:border-primary-light focus:border-primary focus:ring-2 focus:ring-primary/20'
            }
          `}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary focus:outline-none"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>

      {error && (
        <span className="text-xs text-status-error mt-0.5 animate-pulse">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;