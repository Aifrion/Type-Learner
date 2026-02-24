// client/src/components/AlertModal.tsx
import React from 'react';

interface AlertModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p className="modal-text">{message}</p>
        <button className="btn-modal-ok" onClick={onClose}>
          okie
        </button>
      </div>
    </div>
  );
};

export default AlertModal;