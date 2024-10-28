import express from "express";
const router = express.Router();
import {
  getTeamupEvents,
  getTeamupAuth,
} from "../controllers/teamupController";

// Define the route for getting Teamup events
router.get("/events/:calendarId", getTeamupEvents);
router.post("/auth", getTeamupAuth);

export default router;
