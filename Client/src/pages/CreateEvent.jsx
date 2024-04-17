import { useState } from "react";

const CreateEventPage = () => {
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventName, setEventName] = useState("");
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState([]);
  const [additionalInfoInput, setAdditionalInfoInput] = useState("");

  const handleBudgetChange = (e) => {
    setBudget(e.target.value);
  };

  const handleLocationChange = (e) => {
    setLocation(e.target.value);
  };

  const handleEventTypeChange = (e) => {
    setEventType(e.target.value);
  };

  const handleEventDateChange = (e) => {
    setEventDate(e.target.value);
  };

  const handleEventNameChange = (e) => {
    setEventName(e.target.value);
  };

  const handleAdditionalInfoChange = (e) => {
    setAdditionalInfoInput(e.target.value);
  };

  const handleAddInfo = () => {
    if (additionalInfoInput.trim() !== "") {
      setAdditionalInfo([...additionalInfo, additionalInfoInput]);
      setAdditionalInfoInput("");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Create Event</h2>
      <form>
        <div className="mb-4">
          <div className="mb-4">
            <label
              htmlFor="eventName"
              className="block text-gray-700 font-bold mb-2"
            >
              Name
            </label>
            <input
              type="text"
              id="eventName"
              value={eventName}
              onChange={handleEventNameChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>
        <div className="mb-4">
          <label
            htmlFor="eventDate"
            className="block text-gray-700 font-bold mb-2"
          >
            Date
          </label>
          <input
            type="date"
            id="eventDate"
            value={eventDate}
            onChange={handleEventDateChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="eventType"
            className="block text-gray-700 font-bold mb-2"
          >
            Type
          </label>
          <select
            id="eventType"
            value={eventType}
            onChange={handleEventTypeChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            required
          >
            <option value="">Select event type</option>
            <option value="Birthday">Birthday</option>
            <option value="Wedding">Wedding</option>
            <option value="Conference">Conference</option>
            <option value="Company Event">Company Event</option>
            <option value="Graduation">Graduation</option>
            <option value="Holiday">Holiday</option>
            <option value="Trade Show">Trade Show</option>
            <option value="Meetings">Meetings</option>
            <option value="Workshops">Workshops</option>
            <option value="Festival">Festival</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="mb-4">
          <label
            htmlFor="budget"
            className="block text-gray-700 font-bold mb-2"
          >
            Budget
          </label>
          <input
            type="number"
            id="budget"
            value={budget}
            onChange={handleBudgetChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="location"
            className="block text-gray-700 font-bold mb-2"
          >
            Location
          </label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={handleLocationChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="additionalInfo"
            className="block text-gray-700 font-bold mb-2"
          >
            Additional Information
          </label>
          <div className="flex items-center">
            <input
              type="text"
              id="additionalInfo"
              value={additionalInfoInput}
              onChange={handleAdditionalInfoChange}
              className="flex-grow px-3 py-2 border rounded-l-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter additional information"
            />
            <button
              type="button"
              onClick={handleAddInfo}
              className="bg-blue-500 text-white font-bold px-4 py-2 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:bg-blue-700"
            >
              Add
            </button>
          </div>
        </div>
        <div>
          {additionalInfo.map((info, index) => (
            <div key={index} className="mb-2">
              <input
                type="text"
                value={info}
                readOnly
                className="w-full px-3 py-2 border rounded-lg focus:outline-none"
              />
            </div>
          ))}
        </div>
        <button
          type="submit"
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Create Event
        </button>
      </form>
    </div>
  );
};

export default CreateEventPage;
