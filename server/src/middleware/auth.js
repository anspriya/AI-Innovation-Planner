import jwt from 'jsonwebtoken';
export default function auth(req, res, next) {
	const token = req.header('Authorization')?.replace('Bearer ', '');
	if (!token) return res.status(401).json({ error: 'No token' });
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
		req.user = decoded;
		next();
	} catch {
		res.status(401).json({ error: 'Invalid token' });
	}
}
