import express from "express";
const router = express.Router();
import {
  getClickUpTasksFromList,
  //getClickupAuthToken,
} from "../controllers/clickupController";

// Define the route for getting ClickUp tasks
router.get("/tasks/:listID", getClickUpTasksFromList);
//router.get("/auth", getClickupAuthToken);

export default router;
