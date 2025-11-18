import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from "../../contexts/contextLanguage";
import LanguageSwitcher from "../../ui/LanguageSwitcher/LanguageSwitcher";

export const SignUp = () => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);

  const handleBackClick = () => {
    navigate('/'); 
  };

  return (
    <div style={{ 
      maxWidth: '500px', 
      margin: '250px auto', 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        position: 'fixed',
        top: '15px',
        right: '25px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '8px',
        paddingTop: '8px'
      }}>
        <LanguageSwitcher />
      </div>

      <h2 style={{ 
        textAlign: 'center', 
        color: '#333', 
        fontSize: '24px',
        marginBottom: '10px'
      }}>
        {t('auth.title')}
      </h2>

      <p style={{ 
        textAlign: 'center', 
        color: '#555', 
        marginBottom: '30px',
        fontSize: '16px',
        lineHeight: '1.4'
      }}>
        {t('auth.subtitle')}
      </p>

      <button 
        onClick={handleBackClick}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          transition: 'background-color 0.2s, transform 0.1s'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
        onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
        onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
      >
        {t('auth.registerButton')} 
      </button>
    </div>
  );
};