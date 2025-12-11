import {Router} from "express"
import { generateGeminiResponse } from "../controllers/ai.controller.js";

const router = Router();

router.get("/get-result", generateGeminiResponse);
export default router;

