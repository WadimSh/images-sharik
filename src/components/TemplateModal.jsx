export const TemplateModal = ({
  isOpen,
  onClose,
  templateName,
  setTemplateName,
  modalStep,
  modalMessage,
  handleSaveTemplate
}) => (
  isOpen && (
    <div className="modal-overlay">
      {/* Содержимое модалки */}
    </div>
  )
)