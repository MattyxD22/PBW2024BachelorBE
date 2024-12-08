import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
// Indlæser variabler fra .env
dotenv.config();

// Importer routes
import clickupRoutes from "./routes/clickupRoute";
import teamupRoutes from "./routes/teamupRoute";
import globalRoutes from "./routes/globalRoute";

// Opretter express applikation og accepterer forespørgsler fra andre domæner
const app = express();
app.use(
  session({
    secret: "your_secret_key", // Replace with your own secret key
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true if using HTTPS
      maxAge: 3600 * 1000, // 1 hour
    },
  })
);
app.use(
  cors({
    origin: "http://localhost:4200",
    credentials: true, // Allow cookies to be sent
  })
);
app.use(cookieParser());
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Routes for ClickUp og TeamUp API'er
app.use("/api/clickup", clickupRoutes);
app.use("/api/teamup", teamupRoutes);
app.use("/api/global", globalRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

export default app;
