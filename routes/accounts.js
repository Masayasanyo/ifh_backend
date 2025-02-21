import express from 'express';
import bcrypt from 'bcryptjs';
import { pool } from "../index.js";

const router = express.Router();

router.post('/', async (req, res) => {
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

router.post('/data', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: "You need an user id" });
    }

    try {
        const result = await pool.query(
            "SELECT * FROM accounts WHERE id = $1",
            [userId]
        );

        res.status(200).json({ message: "Successful", data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever Error" });
    }

});

router.post('/signup', async (req, res) => {
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

router.post('/login', async (req, res) => {
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
        res.json({ message: "Login Successful", user: { id: user.id, username: user.username, email: user.email, first_name: user.first_name, family_name: user.family_name, profile_image_url: user.profile_image_url} });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever Error" });
    }

});


router.post('/update', async (req, res) => {
    const { userId, username, email, password, firstName, familyName, imagePath } = req.body;

    console.log(req.body);


    if (!userId || !username || !email || !firstName || !familyName) {
        return res.status(400).json({ error: "Fill Everything" });
    }

    if (password) {
        try {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            const result = await pool.query(
                `UPDATE accounts 
                SET username = $1, 
                    email = $2, 
                    password_hash = $3, 
                    first_name = $4, 
                    family_name = $5, 
                    profile_image_url = $6 
                WHERE id = $7 
                RETURNING id, username, email, first_name, family_name, profile_image_url, created_at
                `,
                [username, email, hashedPassword, firstName, familyName, imagePath, userId]
            );
            res.status(200).json({ message: "Registration Successful.", data: result.rows[0] });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Sever Error" });
        }
    }
    else {
        try {
            const result = await pool.query(
                `UPDATE accounts 
                SET username = $1, 
                    email = $2, 
                    first_name = $3, 
                    family_name = $4, 
                    profile_image_url = $5 
                WHERE id = $6 
                RETURNING id, username, email, first_name, family_name, profile_image_url, created_at
                `,
                [username, email, firstName, familyName, imagePath, userId]
            );
            res.status(200).json({ message: "Registration Successful.", data: result.rows[0] });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Sever Error" });
        }
    }
});


export default router;