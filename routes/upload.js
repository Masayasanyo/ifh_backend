import multer from "multer";
import path from "path";
import express from 'express';
import { pool } from "../index.js";

const router = express.Router();

router.post('/', async (req, res) => {
    const { userId, filmFilePath, trailerFilePath, thumbnailFilePath, title, description, genre, crew, duration } = req.body;

    if (!userId || !filmFilePath || !trailerFilePath || !thumbnailFilePath || !title || !description || !genre || crew === null || duration === null) {
        return res.status(400).json({ error: "Fill Everything" });
    }

    try {
        const result = await pool.query(
            "INSERT INTO films (user_id, film_file_path, trailer_file_path, thumbnail_file_path, title, description, genre, duration) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, user_id, film_file_path, trailer_file_path, thumbnail_file_path, title, description, genre, duration, created_at",
            [userId, filmFilePath, trailerFilePath, thumbnailFilePath, title, description, genre, duration]
        );

        const filmId = result.rows[0].id;

        if (crew.length > 0) {
            await Promise.all(crew.map(async (member) => {
                await pool.query(
                    "INSERT INTO film_crews (film_id, first_name, family_name, role, comment, user_id) VALUES ($1, $2, $3, $4, $5, $6)",
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

router.post('/update', async (req, res) => {
    const { userId, filmFilePath, trailerFilePath, thumbnailFilePath, title, description, genre, crew, duration, filmId } = req.body;

    if (!userId || !filmFilePath || !trailerFilePath || !thumbnailFilePath || !title || !description || !genre || crew.length < 1 || duration === null || !filmId) {
        return res.status(400).json({ error: "Fill Everything" });
    }

    try {
        const result = await pool.query(
            `UPDATE films 
            SET user_id = $1, 
                film_file_path = $2, 
                trailer_file_path = $3, 
                thumbnail_file_path = $4, 
                title = $5, 
                description = $6, 
                genre = $7, 
                duration = $8 
            WHERE id = $9 
            RETURNING id, user_id, film_file_path, trailer_file_path, thumbnail_file_path, 
                    title, description, genre, duration, created_at;
            `, 
            [userId, filmFilePath, trailerFilePath, thumbnailFilePath, title, description, genre, duration, filmId]
        );

        await pool.query(`DELETE FROM film_crews WHERE film_id = $1;`, [filmId]);

        if (crew.length > 0) {
            await Promise.all(crew.map(async (member) => {
                await pool.query(
                    `INSERT INTO film_crews (film_id, first_name, family_name, role, comment, user_id) 
                    VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;`,
                    [filmId, member.first_name, member.family_name, member.role, member.comment, member.account_id || null]
                );
            }));
        }
        res.status(201).json({ message: "Update Successful.", data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever Error" });
    }

});



// Film video data
const filmStorage = multer.diskStorage({
    destination: "./storage/films",
    filename: (req, file, cb) => {
        const newFileName = Date.now() + path.extname(file.originalname);
        cb(null, newFileName);    },
});

const filmUpload = multer({ storage: filmStorage });

router.post("/film", filmUpload.single("film"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "File not found" });
    }
    else {
        return res.status(201).json({ message: 'Success!', filePath: `/storage/films/${req.file.filename}` }); 
    }
});



// Trailer video data
const trailerStorage = multer.diskStorage({
    destination: "./storage/trailers",
    filename: (req, file, cb) => {
        const newFileName = Date.now() + path.extname(file.originalname);
        cb(null, newFileName);    },
});

const trailerUpload = multer({ storage: trailerStorage });

router.post("/trailer", trailerUpload.single("trailer"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "File not found" });
    }
    else {
        return res.status(201).json({ message: 'Success!', filePath: `/storage/trailers/${req.file.filename}` }); 
    }
});



// Thumbnail image data
const thumbnailStorage = multer.diskStorage({
    destination: "./storage/thumbnails",
    filename: (req, file, cb) => {
        const newFileName = Date.now() + path.extname(file.originalname);
        cb(null, newFileName);    },
});

const thumbnailUpload = multer({ storage: thumbnailStorage });

router.post("/thumbnail", thumbnailUpload.single("thumbnail"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "File not found" });
    }
    else {
        return res.status(201).json({ message: 'Success!', filePath: `/storage/thumbnails/${req.file.filename}` }); 
    }
});



// Upload profil image
const profileStorage = multer.diskStorage({
    destination: "./storage/profile_images",
    filename: (req, file, cb) => {
        const newFileName = Date.now() + path.extname(file.originalname);
        cb(null, newFileName);    },
});

const profileUpload = multer({ storage: profileStorage });

router.post("/profile_image", profileUpload.single("profile_image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "File not found" });
    }
    else {
        return res.status(201).json({ message: 'Success!', filePath: `/storage/profile_images/${req.file.filename}` }); 
    }
});



export default router;