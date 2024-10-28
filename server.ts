import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Import routes
import clickupRoutes from "./routes/clickupRoute";
import teamupRoutes from "./routes/teamupRoute";

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Routes for ClickUp and Teamup APIs
app.use("/api/clickup", clickupRoutes);
app.use("/api/teamup", teamupRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
