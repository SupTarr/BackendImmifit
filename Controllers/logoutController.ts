import { Request, Response } from "express";
import User from "../Models/userModel.js";

interface RequestWithCookies extends Request {
  cookies: {
    jwt?: string;
  };
}

export const handleLogout = async (req: RequestWithCookies, res: Response) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) {
    return res.sendStatus(204);
  }

  const refreshToken = cookies.jwt;
  try {
    const foundUser = await User.findOne({ refreshToken }).exec();
    res.clearCookie("jwt", { httpOnly: true, secure: true });

    if (!foundUser) {
      return res.sendStatus(204);
    }

    foundUser.refreshToken = undefined;
    await foundUser.save();

    res.sendStatus(204);
  } catch (error) {
    console.error("Logout error:", error);
    res.clearCookie("jwt", { httpOnly: true, secure: true });
    res.status(500).json({ message: "Internal server error during logout" });
  }
};
