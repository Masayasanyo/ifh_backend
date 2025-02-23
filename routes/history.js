import express from 'express';
import { pool } from "../index.js";

const router = express.Router();

router.post('/', async (req, res) => {
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
                history h
            JOIN
                films f ON h.film_id = f.id
            WHERE
                h.user_id = $1;
            `,
            [userId]
        );

        res.status(200).json({ message: "Successfull", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever Error" });
    }
});

router.post('/watched', async (req, res) => {
    const { userId, filmId } = req.body;

    try {
        const result = await pool.query(
            "INSERT INTO history (user_id, film_id) VALUES ($1, $2) RETURNING *;",
            [userId, filmId],
        );
        res.status(200).json({ message: "Successfull", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever Error" });
    }
});

export default router;