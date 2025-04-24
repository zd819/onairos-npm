import React from 'react';
import Sentiment from '../icons/Sentiment.png';
import Avatar from '../icons/Avatar.png';
import Avatar2 from '../icons/Avatar2.png';
import Trait from '../icons/Trait.png';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/**
 * Box Component
 * Displays a checkbox item for data access requests with appropriate icons
 */
const Box = (props) => {
  const selectShortlistedApplicant = (e) => {
    const checked = e.target.checked;
    console.log(`Checkbox ${props.title} is now: ${checked ? 'checked' : 'unchecked'}`);
    if (checked) {
      props.setSelected(true);
      props.changeGranted(1);
    } else {
      props.setSelected(false);
      props.changeGranted(-1);
    }
  };

  const Insight = (props.title === "Avatar") ? 'Avatar' : (props.title === "Traits") ? 'Personality Traits' : 'Persona';

  const getIcon = () => {
    switch (props.title) {
      case "Traits":
        return <img src={Trait || "/placeholder.svg"} alt="Traits" className="w-5 h-5" />;
      case "Avatar":
        return <img src={Avatar2 || "/placeholder.svg"} alt="Avatar" className="w-5 h-5" />;
      default:
        return <img src={Sentiment || "/placeholder.svg"} alt="Interest" className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start space-x-3">
        <Checkbox
          id={`request-${props.number}`}
          disabled={!props.active}
          onCheckedChange={(checked) => {
            selectShortlistedApplicant({ target: { checked } });
            props.onSelectionChange(checked);
          }}
          className={`h-5 w-5 ${!props.active ? "cursor-not-allowed" : ""}`}
        />
        <Label
          htmlFor={`request-${props.number}`}
          className="flex items-center space-x-3 text-sm font-medium text-black peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          <div className="p-1 bg-gray-50 rounded-md">{getIcon()}</div>
          <span>Access your {props.title}</span>
        </Label>
      </div>

      {!props.active && (
        <p className="text-xs text-red-600 font-medium ml-8">
          Please create your Personality model to access this Grant Request
        </p>
      )}
    </div>
  );
};

export default Box;
