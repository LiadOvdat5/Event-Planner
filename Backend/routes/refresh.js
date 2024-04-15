import { Router } from "express";
import handleRefreshToken from "../controllers/refreshToken.js";

const router = Router();

router.get('/', handleRefreshToken);

export default router;