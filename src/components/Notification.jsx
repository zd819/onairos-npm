import React, {useState, useEffect } from 'react';

export default function Notification({ message, color=null, again=false }) {
	const [show, setShow] = useState(true);
	useEffect(() => {
		setShow(true); // Show notification again when `again` changes
		const timer = setTimeout(() => {
		  setShow(false);
		}, 5000);
		
		// Clear timeout if the component unmounts or `again` changes
		return () => clearTimeout(timer);
	  }, [again]); // Dependency array includes `again` so it resets when the prop changes

	return (
		show &&
		<div className={`fixed top-0 left-1/2 transform -translate-x-1/2 text-white px-4 py-2 rounded-b-md shadow-lg z-50 text-center ${color == null ? 'bg-red-600' : `bg-${color}-600`}`}>
		  {message}
		</div>
	  );
}
