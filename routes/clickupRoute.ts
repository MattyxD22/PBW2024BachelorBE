import express from "express";
const router = express.Router();
import {
  getClickUpTasksFromList,
  getClickupListUsers,
  getClickupSingleTask,
  getClickupTaskWithTrackedTime,
  //getClickupAuthToken,
} from "../controllers/clickupController";

// ---GET---
router.get("/tasks/:listID", getClickUpTasksFromList);
router.get("/members/:listID", getClickupListUsers);
router.get("/getSingleTask/:taskID", getClickupSingleTask);
router.get("/getSingleTaskTrackedTime/:taskID", getClickupTaskWithTrackedTime)

//router.get("/auth", getClickupAuthToken);

export default router;
