import express from "express";
const router = express.Router();
import {
  getTeamupEvents,
  getTeamupAuth,
  getTeamupUsers,
  getTeamupSubcalenders
} from "../controllers/teamupController";


// ---GET---
router.get("/events/:calendarId", getTeamupEvents)
router.get("/searchUser/:calendarId", getTeamupUsers);
router.get("/subcalendars:calendarId", getTeamupSubcalenders)


// ---POST---
router.post("/auth", getTeamupAuth);


export default router;
