import { DataNotFoundError } from "../errors/DataNotFoundError.js";
import { DuplicateDataError } from "../errors/DuplicateDataError.js";
import { GeneralServerError } from "../errors/GeneralServerError.js";
import userModel from "../models/User.js";
import { getUserById } from "./UserLogic.js";
import {
  removeVendorDetails,
  vendorExitEventDetails,
  vendorInvetationDetails,
} from "./emailLogic.js";
import { getEventById, removeVendorFromVendorsArrayByPlanner, removeVendorFromVendorsArrayByVendor } from "./eventsLogic.js";
import { sendWebsiteEmail } from "./emailLogic.js";


export const getVendors = async (userId, eventId) => {
  try {
    const options = {
      select: "vendors type location",
      populate: {
        path: "vendors.registeredUser",
        select: "businessName email businessType leadCount",
        options: { strictPopulate: false },
      },
      lean: true,
    };
    const event = await getEventById(userId, eventId, options);
    const { vendors, type, location } = event;
    const negotiatedVendors = [];
    const addedVendors = [];

    for (const vendor of vendors) {
      const vendorData = vendor.registeredUser
        ? vendor.registeredUser
        : vendor.custom;
      vendorData.priceForService = vendor.priceForService;
      if (vendor.status === "Added") addedVendors.push(vendorData);
      else if (vendor.status === "Negotiation")
        negotiatedVendors.push(vendorData);
    }
    const avoidVendors = vendors.map((vendorObj) => {
      if (vendorObj.registeredUser) return vendorObj.registeredUser._id;
    });

    const suggestedVendors = await getSuggestedVendors(
      type,
      location,
      avoidVendors
    );
    const allVendors = {
      suggestedVendors,
      negotiatedVendors,
      addedVendors,
    };
    return allVendors;
  } catch (err) {
    if (err instanceof DataNotFoundError) throw err;
    throw new GeneralServerError(
      `unexpected error getting user's vendors: ${err.message}`
    );
  }
};

export const addCustomVendor = async (
  userId,
  eventId,
  verifiedCustomVendor
) => {
  try {
    const options = {
      select: "vendors budget",
      populate: {
        path: "vendors.registeredUser",
        select: "email",
        options: { strictPopulate: false },
      },
    };
    const event = await getEventById(userId, eventId, options);
    const duplicate = event.vendors.find((vendor) => {
      const vendorData = vendor.registeredUser
        ? vendor.registeredUser
        : vendor.custom;
      return vendorData.email === verifiedCustomVendor.email;
    });
    if (duplicate)
      throw new DuplicateDataError("there is already a vendor with that email");
    const newVendor = {
      custom: {
        businessName: verifiedCustomVendor.businessName,
        email: verifiedCustomVendor.email,
        businessType: verifiedCustomVendor.businessType,
      },
      priceForService: verifiedCustomVendor.priceForService,
    };
    event.vendors.push(newVendor);
    event.budget -= verifiedCustomVendor.priceForService;
    await event.save();
    return newVendor;
  } catch (err) {
    if (err instanceof DataNotFoundError || err instanceof DuplicateDataError)
      throw err;
    throw new GeneralServerError(
      `unexpected error in adding a new custom vendor: ${err.message}`
    );
  }
};

export const getSuggestedVendors = async (type, location, avoidVendors) => {
  try {
    const pipeLine = [
      {
        $match: {
          role: "Vendor",
          businessLocation: location,
          eventTypes: type,
          _id: { $nin: avoidVendors },
        },
      },
      {
        $project: {
          _id: 1,
          businessName: 1,
          email: 1,
          businessType: 1,
          leadCount: 1,
        },
      },
      {
        $sort: {
          leadCount: -1,
        },
      },
    ];
    const suggestedVendors = await userModel.aggregate(pipeLine);
    if (!suggestedVendors)
      throw new DataNotFoundError(
        "No suggested vendors matched the event criteria"
      );
    return suggestedVendors;
  } catch (err) {
    if (err instanceof DataNotFoundError) throw err;
    throw new GeneralServerError(
      "unexpected error in getting suggested Vendors"
    );
  }
};

export const addRegisteredVendor = async (userId, eventId, vendorId) => {
  try {
    const vendorOptions = {
      select: "email businessName",
    };
    const plannerOptions = {
      select: "username email",
    };
    const eventOptions = {
      select: "vendors name type location date",
    };
    const vendor = await getUserById(vendorId, vendorOptions); // check for the existence of user with vendorId
    const eventPlanner = await getUserById(userId, plannerOptions);
    const event = await getEventById(userId, eventId, eventOptions);

    const newRegisteredVendor = {
      registeredUser: vendorId,
      status: "Negotiation",
    };
    event.vendors.push(newRegisteredVendor);
    await event.save();
    // send email to vendor
    const ownerdetails = {
      ownerName: eventPlanner.username,
      ownerEmail: eventPlanner.email,
    };
    const vendorDetails = {
      businessName: vendor.businessName,
      email: vendor.email,
    };
    const eventDetails = {
      name: event.name,
      location: event.location,
      type: event.type,
      date: event.date,
    };
    const mailOptions = vendorInvetationDetails(
      ownerdetails,
      vendorDetails,
      eventDetails
    );
    await sendWebsiteEmail(mailOptions);
    return newRegisteredVendor;
  } catch (err) {
    if (err instanceof DataNotFoundError) throw err;
    throw new GeneralServerError(
      `unexpected error in adding vendor to negotiated vendors: ${err.message}`
    );
  }
};

export const updateRegisteredVendor = async (
  userId,
  eventId,
  vendorId,
  verifiedVendor
) => {
  try {
    const eventOptions = {
      select: "_id vendors budget",
    };

    const event = await getEventById(userId, eventId, eventOptions); //check access control

    //update event's budget
    event.budget -= verifiedVendor.priceForService;
    // update the vendor's price in the array
    const findVendor = event.vendors.find(
      (ven) => ven.registeredUser?.toString() === vendorId
    );
    if (!findVendor)
      throw new DataNotFoundError("couldnt find vendor with that ID");
    findVendor.priceForService = verifiedVendor.priceForService;

    // update the vendor's status first
    findVendor.status = "Added";
    await event.save();

    const vendorOptions = {
      select: "upcomingEvents leadCount",
    };
    const vendor = await getUserById(vendorId, vendorOptions);

    vendor.upcomingEvents.push(event._id);
    vendor.leadCount++;
    await vendor.save();

    return findVendor;
  } catch (err) {
    if (err instanceof DataNotFoundError || err instanceof DuplicateDataError)
      throw err;
    throw new GeneralServerError(
      `unexpected error in updating vendor: ${err.message}`
    );
  }
};

export const updateCustomVendor = async (
  userId,
  eventId,
  vendorEmail,
  verifiedCustomVendor
) => {
  try {
    if (
      verifiedCustomVendor.email &&
      verifiedCustomVendor.email === vendorEmail
    )
      // check for duplicate
      throw new DuplicateDataError(
        "there is already a custom vendor with that email"
      );

    const eventOptions = {
      select: "vendors",
    };
    const event = await getEventById(userId, eventId, eventOptions); // check access control
    const findVendor = event.vendors.custom.find(
      (vendor) => vendor.email === vendorEmail
    );
    if (!findVendor)
      throw new DataNotFoundError("there is no vendor with that email");
    for (const key in verifiedCustomVendor)
      findVendor[key] = verifiedCustomVendor[key];

    await event.save();
    return findVendor;
  } catch (err) {
    if (err instanceof DataNotFoundError || err instanceof DuplicateDataError)
      throw err;
    throw new GeneralServerError(
      `unexpected error in updating Registered vendor: ${err.message}`
    );
  }
};

export const deleteVendor = async (userId, eventId, vendorObj) => {
  try {
    // remove vendor from vendors array:
    const updatedEvent = await removeVendorFromVendorsArrayByPlanner(userId, eventId, vendorObj);
    // if the vendor is registered and added we need to remove his event and decrament his lead count
    if (vendorObj._id && vendorObj.status === "Added") {
        const updatedVendor = await removeUpcomingEventFromArrayByPlanner(eventId, vendorObj);
      //send email to notify the vendor
      const ownerdetails = {
        ownerName: updatedEvent.owner.username,
        ownerEmail: updatedEvent.owner.email,
      };
      const vendorDetails = {
        businessName: vendorObj.businessName,
        email: updatedVendor.email,
      };
      const eventDetails = {
        name:updatedEvent.name,
        location: updatedEvent.location,
        type: updatedEvent.type,
        date: updatedEvent.date,
      };
      const mailOptions = removeVendorDetails(
        ownerdetails,
        vendorDetails,
        eventDetails
      );
      await sendWebsiteEmail(mailOptions);
    }
    return vendorObj;
  } catch (err) {
    if(err instanceof DataNotFoundError) throw err;
    throw new GeneralServerError(`unexpected error in deleting vendor: ${err.message}`);
  }
};

export const deleteVendorUpcomingEvent = async (userId, eventId) => {
  try {
    const updatedVendor = await removeUpcomingEventFromArrayByVendor(userId, eventId);
    const updatedEvent = await removeVendorFromVendorsArrayByVendor(userId, eventId)
    // Send mail to notify event planner (implement mailing logic here)
    const ownerDetails = {
      ownerName: updatedEvent.owner.username,
      ownerEmail: updatedEvent.owner.email,
    };
    const vendorDetails = {
      email: updatedVendor.email,
      businessName: updatedVendor.businessName,
    };
    const eventDetails = {
      name: updatedEvent.name,
      location: updatedEvent.location,
      type: updatedEvent.type,
      date: updatedEvent.date,
    };
    const mailOptions = vendorExitEventDetails(
      ownerDetails,
      vendorDetails,
      eventDetails
    );
    
    await sendWebsiteEmail(mailOptions);
  } catch (err) {
    console.error(err);
    if (err instanceof DataNotFoundError || err instanceof GeneralServerError) throw err;
    throw new GeneralServerError(
      `Unexpected error in deleting vendor's upcoming event: ${err.message}`
    );
  }
};

export const getUpcomingEvents = async (userId) => {
  try {
    const vendorOption = {
      populate: {
        path: "upcomingEvents",
        select: "_id date name type location",
        populate: { path: "owner", select: "-_id email" },
      },
    };
    const user = await getUserById(userId, vendorOption);
    return user.upcomingEvents;
  } catch (err) {
    if (err instanceof DataNotFoundError) throw err;
    throw new GeneralServerError(
      `unexpected error in getting upcoming events: ${err.message}`
    );
  }
};

export const removeUpcomingEventFromArrayByVendor = async (userId, eventId) => {
  try {
    const vendorOptions = {
      select: "upcomingEvents leadCount businessName email",
    };
    const vendor = await getUserById(userId, vendorOptions);
    vendor.upcomingEvents.pull(eventId);
    vendor.leadCount--;
    await vendor.save();
    return vendor;
  } catch(err) {
    if(err instanceof DataNotFoundError) throw err;
    throw new GeneralServerError(`unexpected error in deletinh upcoming event: ${err.message}`)
  }
};

export const removeUpcomingEventFromArrayByPlanner = async (eventId, vendorObj) => {
  try {
    const vendorOptions = {
      select: "upcomingEvents leadCount businessName email",
    };
    const vendor = await getUserById(vendorObj._id, vendorOptions);
    vendor.upcomingEvents.pull(eventId);
    vendor.leadCount--;
    await vendor.save();
    return vendor;
  } catch(err) {
    if(err instanceof DataNotFoundError) throw err;
    throw new GeneralServerError(`unexpected error in deletinh upcoming event: ${err.message}`)
  }
};
