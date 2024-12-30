import Sentiment from '../icons/Sentiment.png';
import Avatar from '../icons/Avatar.png';
import Avatar2 from '../icons/Avatar2.png';
import Trait from '../icons/Trait.png';
import PropTypes from 'prop-types';

export default function Box2(props) {
    const selectShortlistedApplicant = (e) => {
      const checked = e.target.checked;
      if (checked) {
        props.setSelected(true);
        props.changeGranted(1);
        // console.log("Checked");
      } else {
        props.setSelected(false);
        props.changeGranted(-1);
        // console.log("UnChecked");
      }
    };
    const Insight = (props.title === "Avatar")? 'Avatar' : (props.title === "Traits")? 'Personality Traits': 'Persona'
  
    return (
      <div>
        <div className="flex items-center mb-4">
          <input
            onClick={(e) => {
              selectShortlistedApplicant(e);
              props.onSelectionChange(props.type);
              // console.log("New selection in Box : ", props.type, " and event: ", e);
            }}
            id="default-checkbox"
            type="checkbox"
            value=""
            disabled={!props.active}
            className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 ${
              !props.active ? "cursor-not-allowed" : ""
            }`}
          />
          <label
            for="default-checkbox"
            className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
          >
            <div className='flex flex-column'>
            {/* Request {props.number} */}
              {props.title === "Traits" ? (
              // Image to represent Traits
              <img src={Trait} alt="Traits Icon" className="w-6 h-6 mr-2" />
            ) :
            props.title === "Avatar" ? (
              // Image to represent Traits
              <img src={Avatar2} alt="Avatar Icon" className="w-6 h-6 mr-2" />
            ) :
            (
              // Image to represent Interest
              <img src={Sentiment} alt="Interest Icon" className="w-6 h-6 mr-2" />
            )}
            
            Access your {Insight}
            </div>
            
          </label>
        </div>
        {!props.active && (
          <div className="ml-6 text-md text-red-600">
            Please create your Personality model to access this Grant Request
          </div>
        )}
      </div>
    );
  }
  
Box.propTypes = {
  active: PropTypes.bool.isRequired,
  onSelectionChange: PropTypes.func.isRequired,
  changeGranted: PropTypes.func.isRequired,
  setSelected: PropTypes.func.isRequired,
  number: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired
};
  