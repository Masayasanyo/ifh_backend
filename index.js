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



// Account

app.post('/signup', async (req, res) => {
    const { username, email, password, firstName, familyName, imagePath } = req.body;
    if (!username || !email || !password || !firstName || !familyName) {
        return res.status(400).json({ error: "Fill Everything" });
    }
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const result = await pool.query(
            "INSERT INTO accounts (username, email, password_hash, first_name, family_name, profile_image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email, first_name, family_name, profile_image_url, created_at",
            [username, email, hashedPassword, firstName, familyName, imagePath]
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
        res.json({ message: "Login Successful", user: { id: user.id, username: user.username, email: user.email, firstName: user.first_name, familyName: user.family_name, imagePath: user.profile_image_url} });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever Error" });
    }

});



// Upload movies
const movieStorage = multer.diskStorage({
    destination: "./movies",
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

// Upload profil image
const profileStorage = multer.diskStorage({
    destination: "./profile_image",
    filename: (req, file, cb) => {
        const newFileName = Date.now() + path.extname(file.originalname);
        cb(null, newFileName);    },
});
const profileUpload = multer({ storage: profileStorage });
app.post("/upload/profile_image", profileUpload.single("profile_image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "File not found" });
    }
    else {
        return res.status(201).json({ message: 'Success!', filePath: `/profile_image/${req.file.filename}` }); 
    }
});

app.post('/upload', async (req, res) => {
    const { userId, movieFilePath, trailerFilePath, thumbnailFilePath, title, description, genre, crew } = req.body;

    if (!userId || !movieFilePath || !trailerFilePath || !thumbnailFilePath || !title || !description || !genre || crew === null) {
        return res.status(400).json({ error: "Fill Everything" });
    }

    try {
        const result = await pool.query(
            "INSERT INTO films (user_id, movie_path, trailer_path, thumbnail_path, title, description, genre) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, user_id, movie_path, trailer_path, thumbnail_path, title, description, genre, created_at",
            [userId, movieFilePath, trailerFilePath, thumbnailFilePath, title, description, genre]
        );

        const filmId = result.rows[0].id;

        if (crew.length > 0) {
            await Promise.all(crew.map(async (member) => {
                await pool.query(
                    "INSERT INTO film_crew (film_id, first_name, family_name, role, comment, user_id) VALUES ($1, $2, $3, $4, $5, $6)",
                    [filmId, member.firstName, member.familyName, member.role, member.comment, member.accountId || null,]
                );
            }));
        }
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
const PROFILE_DIR = path.join(__dirname, '/profile_image');
app.use('/profile_image', express.static(PROFILE_DIR));

app.get('/films', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM films;",
        );
        res.status(200).json({ message: "Fetch Trailers Successful.", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever Error" });
    }
});

app.get('/films/latest', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM films ORDER BY created_at DESC LIMIT 10;"
        );
        res.status(200).json({ message: "Fetch Films Successful.", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
});

app.get('/films/trending', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT f.* FROM films f LEFT JOIN likes l ON f.id = l.film_id WHERE f.created_at >= NOW() - INTERVAL '7 days' GROUP BY f.id ORDER BY COUNT(l.id) DESC LIMIT 10;"
        );
        res.status(200).json({ message: "Fetch Films Successful.", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
});

app.get('/user/featured', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM accounts ORDER BY created_at DESC LIMIT 10;"
        );
        res.status(200).json({ message: "Successfully fetched Filmmakers.", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
});


app.post('/user/work', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "You need a user id" });
    }

    try {
        const result = await pool.query(
            `SELECT
                f.id AS film_id,
                f.title,
                f.description,
                f.genre,
                f.trailer_path,
                f.movie_path,
                f.thumbnail_path,
                f.created_at
            FROM
                film_crew fc
            JOIN
                films f ON fc.film_id = f.id
            WHERE
                fc.user_id = $1;
            `,
            [userId]
        );

        res.status(200).json({ message: "Successfully fetched user's job.", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever Error" });
    }

});



app.post('/film/data', async (req, res) => {
    const { filmId } = req.body;

    if (!filmId) {
        return res.status(400).json({ error: "You need a film id" });
    }

    try {
        const result = await pool.query(
            "SELECT * FROM films WHERE id = $1",
            [filmId]
        );

        res.status(200).json({ message: "Successfull", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever Error" });
    }

});



app.post('/accounts', async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: "You need an username" });
    }

    try {
        const result = await pool.query(
            "SELECT * FROM accounts WHERE username ILIKE $1",
            [`%${username}%`]
        );

        res.status(200).json({ message: "Searching Successful.", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever Error" });
    }

});


app.post('/members', async (req, res) => {
    const { filmId } = req.body;

    if (!filmId) {
        return res.status(400).json({ error: "You need a film id" });
    }

    try {
        const result = await pool.query(
            `SELECT fc.id AS film_crew_id, fc.film_id,
            COALESCE(a.username, fc.crew_username) AS username,
            COALESCE(a.first_name, fc.first_name) AS first_name,
            COALESCE(a.family_name, fc.family_name) AS family_name,
            fc.role,
            fc.created_at AS film_crew_created_at,
            fc.comment,
            fc.user_id,
            a.id AS account_id,
            a.email,
            a.profile_image_url,
            a.created_at AS account_created_at FROM film_crew fc LEFT JOIN accounts a ON fc.user_id = a.id WHERE fc.film_id = $1;`,
            [filmId]
        );

        res.status(200).json({ message: "Searching Successful.", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever Error" });
    }

});


app.post('/films/like/initial', async (req, res) => {
    const { userId, filmId } = req.body;

    try {
        const result = await pool.query(
            "SELECT 1 FROM likes WHERE user_id = $1 AND film_id = $2 LIMIT 1;",
            [userId, filmId]
        );
        const isLiked = result.rowCount > 0;

        res.status(200).json({ isLiked });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
});

app.post('/films/like', async (req, res) => {
    const { userId, filmId } = req.body;

    try {
        await pool.query(
            "INSERT INTO likes (user_id, film_id) VALUES ($1, $2) ON CONFLICT (user_id, film_id) DO NOTHING;",
            [userId, filmId]
        );
        res.status(200).json({ message: "Liked successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
});

app.post('/films/dislike', async (req, res) => {
    const { userId, filmId } = req.body;

    try {
        await pool.query(
            "DELETE FROM likes WHERE user_id = $1 AND film_id = $2;",
            [userId, filmId]
        );
        res.status(200).json({ message: "Disliked successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
});



const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server: ${PORT}`);
});