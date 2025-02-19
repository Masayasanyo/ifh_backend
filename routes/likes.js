import express from 'express';
import { pool } from "../index.js";

const router = express.Router();

router.post('/', async (req, res) => {
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

router.post('/like', async (req, res) => {
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

router.post('/dislike', async (req, res) => {
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

export default router;