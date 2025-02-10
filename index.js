import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import bcrypt from 'bcryptjs'; 
import pkg from 'pg';
import multer from "multer";
import path from "path";
const { Pool } = pkg;


dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: "Fill Everything" });
    }

    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const result = await pool.query(
            "INSERT INTO accounts (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at",
            [username, email, hashedPassword]
        );

        res.status(201).json({ message: "Registration Successful.", user: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever Error" });
    }

});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(email);


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

        res.json({ message: "Login Successful", user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever Error" });
    }

});

// Upload video
const storage = multer.diskStorage({
    destination: "./video",
    filename: (req, file, cb) => {
        const newFileName = Date.now() + path.extname(file.originalname);
        cb(null, newFileName);    },
});
const upload = multer({ storage });
app.post("/upload/video", upload.single("video"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "File not found" });
    }
    else {
        return res.status(201).json({ message: 'Success!', filePath: `/video/${req.file.filename}` }); 
    }
});

app.post('/upload', async (req, res) => {
    const { userId, filePath, title, description } = req.body;

    if (!userId || !filePath || !title || !description) {
        return res.status(400).json({ error: "Fill Everything" });
    }

    try {
        const result = await pool.query(
            "INSERT INTO video (user_id, file_path, title, description) VALUES ($1, $2, $3, $4) RETURNING id, user_id, file_path, title, description, created_at",
            [userId, filePath, title, description]
        );

        res.status(201).json({ message: "Upload Successful.", data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Sever Error" });
    }

});


const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server: ${PORT}`);
});