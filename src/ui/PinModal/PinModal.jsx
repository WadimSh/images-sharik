import { useState, useEffect, useContext } from 'react';
import { useNavigate } from "react-router-dom";
import { LuDelete } from "react-icons/lu";
import { AiOutlineEnter } from "react-icons/ai";

import { LanguageContext } from '../../contexts/contextLanguage';
import { useAuth } from '../../contexts/AuthContext';
import './PinModal.css';

const PinModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useContext(LanguageContext);

  const [pin, setPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const date = new Date();
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      setCurrentPin(String(year + month + day));
      setPin('');
      setError('');
    }
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (!isOpen) return;
    
    if (e.key >= '0' && e.key <= '9' && pin.length < 4) {
      setPin(pin + e.key);
      setError('');
    } else if (e.key === 'Backspace') {
      handleDelete();
    } else if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, pin]);

  const handleNumberClick = (number) => {
    if (pin.length < 4) {
      setPin(pin + number);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleSubmit = () => {
    if (pin.length < 4) {
      setError('Please enter 4-digit PIN');
      return;
    }

    if (pin === currentPin) {
      login(); 
      onClose();
      navigate('/create');
    } else {
      setError('Invalid PIN code');
      setPin('');
      setTimeout(() => setError(''), 2000);
    }
  };

  return (
    <div className={`pin-modal ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="pin-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: '28px' }}>{t('modals.titlePIN')}</h2>
        
        {!error && <div className="pin-display">
          {Array(4).fill(0).map((_, i) => (
            <span key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
          ))}

        </div>}
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="pin-keyboard">
          <div className="pin-row">
            {[1, 2, 3].map(num => (
              <button 
                key={num} 
                className="pin-button" 
                onClick={() => handleNumberClick(num.toString())}
                onMouseDown={(e) => e.preventDefault()}
              >
                {num}
              </button>
            ))}
          </div>
          <div className="pin-row">
            {[4, 5, 6].map(num => (
              <button 
                key={num} 
                className="pin-button" 
                onClick={() => handleNumberClick(num.toString())}
                onMouseDown={(e) => e.preventDefault()}
              >
                {num}
              </button>
            ))}
          </div>
          <div className="pin-row">
            {[7, 8, 9].map(num => (
              <button 
                key={num} 
                className="pin-button" 
                onClick={() => handleNumberClick(num.toString())}
                onMouseDown={(e) => e.preventDefault()}
              >
                {num}
              </button>
            ))}
          </div>
          <div className="pin-row">
            <button 
              className="pin-button delete" 
              onClick={handleDelete}
              onMouseDown={(e) => e.preventDefault()}
            >
              <LuDelete />
            </button>
            <button 
              className="pin-button" 
              onClick={() => handleNumberClick('0')}
              onMouseDown={(e) => e.preventDefault()}
            >
              0
            </button>
            <button 
              className="pin-button submit" 
              onClick={handleSubmit}
              onMouseDown={(e) => e.preventDefault()}
            >
              <AiOutlineEnter />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinModal;