import { RiDeleteBin2Line } from 'react-icons/ri';

const AiLogDeleteModal = ({ isOpen, onClose, onConfirm, operationLabel }) => {
  if (!isOpen) return null;

  return (
    <div className="delete-confirmation-modal" onClick={onClose}>
      <div className="delete-confirmation-content" onClick={(event) => event.stopPropagation()}>
        <div className="delete-confirmation-header">
          <RiDeleteBin2Line className="warning-icon" />
          <h3>Удаление лога</h3>
        </div>

        <div className="delete-confirmation-body">
          <p>
            Вы уверены, что хотите удалить лог
            {operationLabel ? <> <strong>«{operationLabel}»</strong></> : null}?
          </p>
          <p className="warning-text">Это действие невозможно отменить.</p>
        </div>

        <div className="delete-confirmation-footer">
          <button type="button" className="delete-btn delete-btn-secondary" onClick={onClose}>
            Отменить
          </button>
          <button type="button" className="delete-btn delete-btn-danger" onClick={onConfirm}>
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiLogDeleteModal;
