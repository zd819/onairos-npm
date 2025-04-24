import React, { useState } from 'react';
import Box from './Box';
import { Card } from "@/components/ui/card";

/**
 * IndividualConnection Component
 * Displays a card for each data connection request
 */
function IndividualConnection(props) {
  const [selected, setSelected] = useState(false);

  const handleSelectionChange = (isSelected) => {
    setSelected(isSelected);
    props.onSelectionChange(isSelected);
  };

  // The insight type based on title
  const Insight = (props.title === "Avatar") ? 'Avatar' : (props.title === "Traits") ? 'Personality Traits' : 'Persona';

  return (
    <Card className="overflow-hidden outline-2 outline-black/10 bg-white shadow-sm hover:shadow-md transition-all">
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between">
          <Box
            active={props.active}
            onSelectionChange={handleSelectionChange}
            changeGranted={props.changeGranted}
            setSelected={setSelected}
            number={props.number + 1}
            type={"Test"}
            title={props.title}
          />
        </div>

        {props.descriptions && props.title !== "Avatar" && (
          <div className="space-y-2 border-t pt-3">
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-semibold text-black/70">Intent</span>
              <span className="text-sm text-black">{props.descriptions}</span>
            </div>
          </div>
        )}

        {props.rewards && (
          <div className="flex flex-col space-y-1 border-t pt-3">
            <span className="text-xs font-semibold text-black/70">Rewards</span>
            <span className="text-sm text-black">{props.rewards}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

export default IndividualConnection;
