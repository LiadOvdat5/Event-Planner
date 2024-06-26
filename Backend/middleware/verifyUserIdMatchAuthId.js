import { ObjectId } from "mongodb";

export const verifyUserIdMatchAuthId = (req, res, next) => {
  if (!req?.params?.id)
    return res.status(400).json({ error: "user id is missing in the request" });

  const id = req.params.id;
  if (!ObjectId.isValid(id))
    return res.status(400).json({ error: "user id is not valid" });

  if (!req?.userId || id !== req.userId.toString()) {
    return res
      .status(401)
      .json({ msg: "you dont have an access to this resource" });
  }

  next();
};
