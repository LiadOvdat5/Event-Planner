import { DataNotFoundError } from "../errors/DataNotFoundError.js";
import { GeneralServerError } from "../errors/GeneralServerError.js";
import eventModel from "../models/Event.js";
import userModel from "../models/User.js";
import { getIdbyEmail } from "./UserLogic.js";

export const getEventsGeneralData = async (user) => {
  try {
    await user.populate({
      path: "events",
      select: "name date type budget location collaborators",
      populate: {
        path: "collaborators",
        select: "email -_id",
      },
    });

    const events = user.events;
    console.log(events);
    return events;
  } catch (err) {
    throw new GeneralServerError();
  }
};
export const getEventsFullData = async (user) => {
  try {
    await user.populate({
      path: "events",
      populate: {
        path: "collaborators",
        select: "email -_id",
      },
    });
    const events = user.events;
    return events;
  } catch (err) {
    throw new GeneralServerError();
  }
};
export const getEvents = async (id) => {
  try {
    const user = await userModel.findById(id);
    if (!user) throw new DataNotFoundError();
    const events = await getEventsGeneralData(user);
    return events;
  } catch (err) {
    throw err;
  }
};

export const createEvent = async (id, event) => {
  try {
    const user = await userModel.findById(id);
    if (!user) throw new DataNotFoundError();
    const {
      name,
      date,
      type,
      budget,
      location,
      additionalInfo,
      collaborators,
    } = event;
    console.log("additionalInfo", additionalInfo);
    //set collaborators
    const idArray = [id];
    //TODO: change email validate to ignore uppercase and lowercase
    for (const email of collaborators) {
      const collaboratorId = await getIdbyEmail(email);
      idArray.push(collaboratorId);
    }
    const newEvent = await eventModel.create({
      name,
      date,
      type,
      budget,
      location,
      additionalInfo,
      collaborators: idArray,
    });
    // set event to the user
    user.events.push(newEvent);
    await user.save();
    //TODO: set event to collaborators only after they accept
    return newEvent;
  } catch (err) {
    throw err;
  }
};
