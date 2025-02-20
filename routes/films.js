import express from 'express';
import { pool } from "../index.js";

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM films;",
        );
        res.status(200).json({ message: "Successfull", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever Error" });
    }
});



router.get('/latest', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM films ORDER BY created_at DESC LIMIT 10;"
        );
        res.status(200).json({ message: "Successfull", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
});



router.get('/trending', async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT f.* FROM films f LEFT JOIN likes l ON f.id = l.film_id WHERE f.created_at >= NOW() - INTERVAL '7 days' GROUP BY f.id ORDER BY COUNT(l.id) DESC LIMIT 10;"
        );
        res.status(200).json({ message: "Successfull", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
});



router.post('/data', async (req, res) => {
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



router.post('/works', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "You need a user id" });
    }

    try {
        const result = await pool.query(
            `SELECT DISTINCT ON (f.id) 
                f.id AS film_id,
                f.title,
                f.description,
                f.genre,
                f.trailer_file_path,
                f.film_file_path,
                f.thumbnail_file_path,
                f.created_at
            FROM
                film_crews fc
            JOIN
                films f ON fc.film_id = f.id
            WHERE
                fc.user_id = $1;
            `,
            [userId]
        );

        res.status(200).json({ message: "Fetched user's works successfully", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever Error" });
    }

});

router.post('/watchlist', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "You need an user id" });
    }

    try {
        const result = await pool.query(
            `SELECT DISTINCT ON (f.id) 
                f.id AS film_id,
                f.title,
                f.description,
                f.genre,
                f.trailer_file_path,
                f.film_file_path,
                f.thumbnail_file_path,
                f.created_at
            FROM
                watchlist w
            JOIN
                films f ON w.film_id = f.id
            WHERE
                w.user_id = $1;
            `,
            [userId]
        );

        res.status(200).json({ message: "Successfull", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever Error" });
    }

});

export default router;