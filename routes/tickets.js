import express from 'express';
import { pool } from "../index.js";

const router = express.Router();

router.post('/', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "You need a user id" });
    }

    try {
        const result = await pool.query(
            `SELECT 
                COUNT(*) 
            FROM 
                tickets 
            WHERE 
                user_id = $1 AND status = TRUE;`,
            [userId]
        );

        res.status(200).json({ message: "Fetch tickets successful.", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever Error" });
    }

});

router.post('/use', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "You need a user id" });
    }

    try {
        const result = await pool.query(
            `UPDATE  
                tickets 
            SET 
                status = FALSE, 
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = (
                SELECT id FROM tickets 
                WHERE user_id = $1 AND status = TRUE 
                ORDER BY id 
                LIMIT 1
            )
            RETURNING *;
            `,
            [userId]
        );

        res.status(200).json({ message: "Use a ticket successful.", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever Error" });
    }

});

router.post('/get/single', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "You need a user id" });
    }

    try {
        const result = await pool.query(
            `INSERT INTO 
                tickets 
                (user_id) 
            VALUES 
                ($1) 
            RETURNING 
                id, user_id`,
            [userId]
        );

        res.status(200).json({ message: "Get a ticket successful.", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever Error" });
    }

});

router.post('/get/bundle', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "You need a user id" });
    }

    for (let i = 0; i < 10; i++) {
        try {
            const result = await pool.query(
                `INSERT INTO 
                    tickets 
                    (user_id) 
                VALUES 
                    ($1) 
                RETURNING 
                    id, user_id`,
                [userId]
            );
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Sever Error" });
        }
    }

    res.status(200).json({ message: "Get a ticket successful."});

});


export default router;