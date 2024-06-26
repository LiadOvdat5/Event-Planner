import { authenticateUser, getUserByUsername } from "../services/UserLogic.js";

export const handleUserLogin = async (req, res) => {
  try {
    if (!req?.body?.username || !req?.body?.password)
      return res
        .status(400)
        .json({ err: "username and password are required" });
    const {
      body: { username, password },
    } = req;

    const user = { username, password };
    const authUser = await authenticateUser(user);
    res.cookie("jwt", authUser.refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      accessToken: authUser.accessToken,
      userName: username,
      email: authUser.email,
    });
  } catch (err) {
    return res.status(err.statusCode).json({ err: err.message });
  }
};
