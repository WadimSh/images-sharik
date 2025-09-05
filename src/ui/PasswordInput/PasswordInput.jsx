import { useState } from 'react';
import { FaEyeSlash, FaEye } from "react-icons/fa";

export const PasswordInput = ({ 
  value, 
  onChange, 
  placeholder, 
  disabled = false,
  required = true,
  minLength = 6,
  id,
  name 
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        type={showPassword ? 'text' : 'password'}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        disabled={disabled}
        placeholder={placeholder}
        style={{ 
          width: '100%', 
          padding: '12px 45px 12px 12px', 
          border: '1px solid #ddd',
          borderRadius: '4px',
          boxSizing: 'border-box',
          fontSize: '16px',
          backgroundColor: disabled ? '#f5f5f5' : 'white',
          transition: 'border-color 0.2s'
        }}
        onFocus={(e) => e.target.style.borderColor = '#007bff'}
        onBlur={(e) => e.target.style.borderColor = '#ddd'}
      />
      <button
        type="button"
        onClick={togglePasswordVisibility}
        disabled={disabled}
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: '4px',
          color: '#666',
          fontSize: '18px'
        }}
        title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
      >
        {showPassword ? <FaEye /> : <FaEyeSlash />}
      </button>
    </div>
  );
};