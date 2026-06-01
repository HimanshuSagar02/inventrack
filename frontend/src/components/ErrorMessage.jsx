import React from 'react';
import './ErrorMessage.css';

function ErrorMessage({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="error-card">
      <span className="error-icon">⚠️</span>
      <div className="error-content">
        <h3 className="error-title">Error</h3>
        <p className="error-message">{message}</p>
      </div>
      {onRetry && (
        <button className="btn btn-secondary error-retry" onClick={onRetry}>
          ↻ Retry
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
