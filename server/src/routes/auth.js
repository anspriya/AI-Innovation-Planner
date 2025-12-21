import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
	const { email, password, name } = req.body;
	if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
	const existing = await User.findOne({ email });
	if (existing) return res.status(400).json({ error: 'Email exists' });
	const hash = await bcrypt.hash(password, 10);
	const user = await User.create({ email, password: hash, name });
	const token = jwt.sign({ id: user._id, email }, process.env.JWT_SECRET || 'supersecret');
	res.json({ token, user: { email, name } });
});

// Login
router.post('/login', async (req, res) => {
	const { email, password } = req.body;
	const user = await User.findOne({ email });
	if (!user) return res.status(400).json({ error: 'Invalid credentials' });
	const valid = await bcrypt.compare(password, user.password);
	if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
	const token = jwt.sign({ id: user._id, email }, process.env.JWT_SECRET || 'supersecret');
	res.json({ token, user: { email, name: user.name } });
});

export default router;
// ...existing code from idea-app/backend/src/routes/auth.js...