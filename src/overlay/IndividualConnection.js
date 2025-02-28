import React from 'react';
import PropTypes from 'prop-types';

export default function IndividualConnection({
  active,
  title,
  id,
  number,
  descriptions,
  rewards,
  size,
  isChecked,
  onCheckboxChange,
}) {
  return (
    <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="group">
            <div>
              <input
                disabled={!active}
                type="checkbox"
                checked={isChecked}
                onChange={(e) => onCheckboxChange(e.target.checked)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center">
          {/* Optional icons or additional UI elements */}
        </div>

        {descriptions && title !== "Avatar" && (
          <p className="text-sm font-medium text-gray-900 dark:text-gray-300">
            Intent: {descriptions}
          </p>
        )}

        {rewards && (
          <p className="text-sm font-medium text-gray-900 dark:text-gray-300">
            Rewards: {rewards}
          </p>
        )}
      </div>
    </div>
  );
}

IndividualConnection.propTypes = {
  active: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  id: PropTypes.any.isRequired,
  number: PropTypes.number.isRequired,
  descriptions: PropTypes.string,
  rewards: PropTypes.string,
  size: PropTypes.string.isRequired,
  isChecked: PropTypes.bool.isRequired,
  onCheckboxChange: PropTypes.func.isRequired,
};
