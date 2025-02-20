import express from 'express';
import { pool } from "../index.js";

const router = express.Router();

router.post('/', async (req, res) => {
    const { userId, filmId } = req.body;

    try {
        const result = await pool.query(
            "SELECT 1 FROM watchlist WHERE user_id = $1 AND film_id = $2 LIMIT 1;",
            [userId, filmId]
        );
        const isSaved = result.rowCount > 0;

        res.status(200).json({ isSaved });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
});

router.post('/true', async (req, res) => {
    const { userId, filmId } = req.body;

    try {
        await pool.query(
            "INSERT INTO watchlist (user_id, film_id) VALUES ($1, $2) ON CONFLICT (user_id, film_id) DO NOTHING;",
            [userId, filmId]
        );
        res.status(200).json({ message: "Saved successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
});

router.post('/false', async (req, res) => {
    const { userId, filmId } = req.body;

    try {
        await pool.query(
            "DELETE FROM watchlist WHERE user_id = $1 AND film_id = $2;",
            [userId, filmId]
        );
        res.status(200).json({ message: "Unsaved successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
});

export default router;