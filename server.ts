import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors"

// Indlæser variabler fra .env 
dotenv.config();

// Importer routes
import clickupRoutes from "./routes/clickupRoute";
import teamupRoutes from "./routes/teamupRoute";

// Opretter express applikation og accepterer forespørgsler fra andre domæner
const app = express();
app.use(cors())
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Routes for ClickUp og TeamUp API'er
app.use("/api/clickup", clickupRoutes);
app.use("/api/teamup", teamupRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
