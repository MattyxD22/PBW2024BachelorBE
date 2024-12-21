import express from "express";
const router = express.Router();

import {
  getClickUpTasksFromList,
  getClickupListUsers,
  //getClickupSingleTask,
  //getClickupTaskWithTrackedTime,
} from "../controllers/clickup.controller";

// ---GET---
router.get("/tasks/:email", getClickUpTasksFromList);
router.get("/members", getClickupListUsers);
//router.get("/getSingleTask/:taskID", getClickupSingleTask);
//router.get("/getSingleTaskTrackedTime/:taskID", getClickupTaskWithTrackedTime)

export default router;
