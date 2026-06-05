import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiMoreVertical } from 'react-icons/fi';
import { RiDeleteBin2Line } from 'react-icons/ri';

const AiLogRowMenu = ({ onDelete }) => {
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isOpen) return undefined;

    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.right - 150,
      });
    };

    updatePosition();

    const handleClickOutside = (event) => {
      if (
        menuRef.current?.contains(event.target)
        || buttonRef.current?.contains(event.target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  const handleToggle = (event) => {
    event.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleDelete = (event) => {
    event.stopPropagation();
    setIsOpen(false);
    onDelete();
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="ai-log-row-menu-button"
        onClick={handleToggle}
        aria-label="Действия"
      >
        <FiMoreVertical />
      </button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="context-menu ai-log-row-menu"
          style={{ position: 'fixed', top: position.top, left: position.left }}
        >
          <button type="button" className="context-delete" onClick={handleDelete}>
            <RiDeleteBin2Line style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Удалить
          </button>
        </div>,
        document.body
      )}
    </>
  );
};

export default AiLogRowMenu;
