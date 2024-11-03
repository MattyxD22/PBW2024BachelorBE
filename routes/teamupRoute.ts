import express from "express";
const router = express.Router();
import {
  getTeamupEvents,
  getTeamupAuth,
  getTeamupUsers,
  getTeamupSubcalenders,
  getTeamupUserEvents
} from "../controllers/teamupController";


// ---GET---
router.get("/events", getTeamupEvents);
router.get("/searchUser/:calendarId", getTeamupUsers);
router.get("/subcalendars", getTeamupSubcalenders);
router.get("/userEvents/:email", getTeamupUserEvents);


// ---POST---
router.post("/auth", getTeamupAuth);


export default router;
