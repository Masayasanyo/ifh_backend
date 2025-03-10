import express from 'express';
import { pool } from "../index.js";

const router = express.Router();

router.get('/ranking', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                f.* 
            FROM 
                films f 
            LEFT JOIN 
                likes l ON f.id = l.film_id 
            WHERE 
                f.created_at >= NOW() - INTERVAL '7 days' 
            GROUP BY 
                f.id 
            ORDER BY 
                COUNT(l.id) 
            DESC LIMIT 
                30;
            `
        );
        res.status(200).json({ message: "Successfull", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
});

router.get('/schedule', async (req, res) => {

    try {
        const result = await pool.query(
            `SELECT 
                f.id AS film_id,
                f.title,
                f.description,
                f.genre,
                f.trailer_file_path,
                f.film_file_path,
                f.thumbnail_file_path,
                f.created_at, 
                f.duration, 
                s.date
            FROM
                showtimes s 
            JOIN 
                films f ON s.film_id = f.id 
            WHERE 
                s.date >= CURRENT_DATE
            ORDER BY 
                s.date 
            `,
        );

        res.status(200).json({ message: "Successfull", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }

});



router.post('/schedule/add', async (req, res) => {
    const { filmId, date, screenNumber } = req.body;

    console.log(req.body);

    if (!filmId) {
        return res.status(400).json({ error: "Film id id required" });
    }

    try {
        const result = await pool.query(
            `INSERT INTO showtimes (film_id, date, screen_number)
             VALUES ($1, $2, $3)
             ON CONFLICT (date, screen_number) 
             DO UPDATE SET film_id = EXCLUDED.film_id
             RETURNING *;`,
            [filmId, date, screenNumber]
        );

        res.status(200).json({ message: "Success", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever Error" });
    }

});


export default router;