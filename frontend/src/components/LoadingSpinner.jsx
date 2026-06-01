import React from 'react';
import './LoadingSpinner.css';

function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="spinner-container">
      <div className="spinner">
        <div className="spinner-ring" />
        <div className="spinner-ring spinner-ring--inner" />
      </div>
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );
}

export default LoadingSpinner;
