import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import bcrypt from 'bcryptjs'; 
import pkg from 'pg';
import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';

dotenv.config();
const { Pool } = pkg;
const app = express();
app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: "Fill Everything" });
    }
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const result = await pool.query(
            "INSERT INTO accounts (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at",
            [username, email, hashedPassword]
        );
        res.status(201).json({ message: "Registration Successful.", user: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever Error" });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Fill everything" });
    }
    try {
        const result = await pool.query("SELECT * FROM accounts WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Email or Password are wrong." });
        }
        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ error: "Email or Password are wrong." });
        }
        res.json({ message: "Login Successful", user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever Error" });
    }

});

// Upload movies
const movieStorage = multer.diskStorage({
    destination: "./moives",
    filename: (req, file, cb) => {
        const newFileName = Date.now() + path.extname(file.originalname);
        cb(null, newFileName);    },
});
const movieUpload = multer({ storage: movieStorage });
app.post("/upload/movie", movieUpload.single("movie"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "File not found" });
    }
    else {
        return res.status(201).json({ message: 'Success!', filePath: `/movies/${req.file.filename}` }); 
    }
});


// Upload trailers
const trailerStorage = multer.diskStorage({
    destination: "./trailers",
    filename: (req, file, cb) => {
        const newFileName = Date.now() + path.extname(file.originalname);
        cb(null, newFileName);    },
});
const trailerUpload = multer({ storage: trailerStorage });
app.post("/upload/trailer", trailerUpload.single("trailer"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "File not found" });
    }
    else {
        return res.status(201).json({ message: 'Success!', filePath: `/trailers/${req.file.filename}` }); 
    }
});

// Upload thumbnails
const thumbnailStorage = multer.diskStorage({
    destination: "./thumbnails",
    filename: (req, file, cb) => {
        const newFileName = Date.now() + path.extname(file.originalname);
        cb(null, newFileName);    },
});
const thumbnailUpload = multer({ storage: thumbnailStorage });
app.post("/upload/thumbnail", thumbnailUpload.single("thumbnail"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "File not found" });
    }
    else {
        return res.status(201).json({ message: 'Success!', filePath: `/thumbnails/${req.file.filename}` }); 
    }
});

app.post('/upload', async (req, res) => {
    const { userId, movieFilePath, trailerFilePath, thumbnailFilePath, title, description } = req.body;

    if (!userId || !movieFilePath || !trailerFilePath || !thumbnailFilePath || !title || !description) {
        return res.status(400).json({ error: "Fill Everything" });
    }

    try {
        const result = await pool.query(
            "INSERT INTO films (user_id, movie_path, trailer_path, thumbnail_path, title, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, user_id, movie_path, trailer_path, thumbnail_path, title, description, created_at",
            [userId, movieFilePath, trailerFilePath, thumbnailFilePath, title, description]
        );

        res.status(201).json({ message: "Upload Successful.", data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever Error" });
    }

});


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TRAILER_DIR = path.join(__dirname, '/trailers');
app.use('/trailers', express.static(TRAILER_DIR));
const MOVIE_DIR = path.join(__dirname, '/movies');
app.use('/movies', express.static(MOVIE_DIR));
const THUMBNAIL_DIR = path.join(__dirname, '/thumbnails');
app.use('/thumbnails', express.static(THUMBNAIL_DIR));

app.get('/films', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM films;",
        );
        res.status(201).json({ message: "Fetch Trailers Successful.", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever Error" });
    }
});


const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server: ${PORT}`);
});