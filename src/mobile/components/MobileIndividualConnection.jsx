import React from 'react';

/**
 * MobileIndividualConnection Component
 * Mobile-optimized version of the IndividualConnection component
 * for displaying data request options in React Native
 */
export default function MobileIndividualConnection({
  active,
  title,
  id,
  number,
  descriptions,
  rewards,
  size,
  changeGranted,
  onSelectionChange,
}) {
  const handleCheckboxChange = (isSelected) => {
    // Report the selection to parent component
    onSelectionChange(isSelected);
  };

  return (
    <div className="mobile-connection-container">
      <div className="mobile-connection-header">
        <div className="mobile-connection-checkbox-area">
          <input
            type="checkbox"
            disabled={!active}
            className="mobile-connection-checkbox"
            onChange={(e) => handleCheckboxChange(e.target.checked)}
          />
          <span className="mobile-connection-title">{title}</span>
        </div>

        {rewards && (
          <div className="mobile-connection-rewards">
            Rewards: {rewards}
          </div>
        )}
      </div>

      {descriptions && title !== "Avatar" && (
        <div className="mobile-connection-description">
          Intent: {descriptions}
        </div>
      )}
    </div>
  );
}
