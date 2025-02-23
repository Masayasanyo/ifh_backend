import express from 'express';
import { pool } from "../index.js";

const router = express.Router();



router.get('/featured', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                * 
            FROM 
                accounts 
            ORDER BY 
                created_at 
            DESC 
            LIMIT 10;
            `
        );
        res.status(200).json({ message: "Fetched filmmakers successfully", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
});



router.post('/crews', async (req, res) => {
    const { filmId } = req.body;

    if (!filmId) {
        return res.status(400).json({ error: "You need a film id" });
    }

    try {
        const result = await pool.query(
            `SELECT 
                fc.id AS film_crew_id, 
                fc.film_id,
                COALESCE(a.first_name, fc.first_name) AS first_name,
                COALESCE(a.family_name, fc.family_name) AS family_name,
                fc.role,
                fc.created_at AS film_crew_created_at,
                fc.comment,
                fc.user_id,
                a.id AS account_id,
                a.username, 
                a.email,
                a.profile_image_url,
                a.created_at AS account_created_at 
            FROM 
                film_crews fc 
            LEFT JOIN 
                accounts a 
            ON 
                fc.user_id = a.id 
            WHERE 
                fc.film_id = $1;
            `,
            [filmId]
        );

        res.status(200).json({ message: "Searching Successful.", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever Error" });
    }

});


export default router;