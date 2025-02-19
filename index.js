import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import pkg from 'pg';
import path from "path";
import { fileURLToPath } from 'url';
import accountsRoutes from "./routes/accounts.js";
import uploadRoutes from "./routes/upload.js";
import filmsRoutes from "./routes/films.js";
import usersRoutes from "./routes/users.js";
import likesRoutes from "./routes/likes.js";

dotenv.config();

const { Pool } = pkg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use("/accounts", accountsRoutes);
app.use("/upload", uploadRoutes);
app.use("/films", filmsRoutes);
app.use("/users", usersRoutes);
app.use("/likes", likesRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TRAILER_DIR = path.join(__dirname, '/storage/trailers');
app.use('/storage/trailers', express.static(TRAILER_DIR));
const FILM_DIR = path.join(__dirname, '/storage/films');
app.use('/storage/films', express.static(FILM_DIR));
const THUMBNAIL_DIR = path.join(__dirname, '/storage/thumbnails');
app.use('/storage/thumbnails', express.static(THUMBNAIL_DIR));
const PROFILE_DIR = path.join(__dirname, '/storage/profile_images');
app.use('/storage/profile_images', express.static(PROFILE_DIR));

export { pool };

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server: ${PORT}`);
});