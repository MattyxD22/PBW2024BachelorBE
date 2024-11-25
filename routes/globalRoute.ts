import express from "express";
import { exportCSV } from "../controllers/globalController";
const router = express.Router();
router.post("/exportcsv", exportCSV);

export default router;