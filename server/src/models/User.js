import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true }, // hashed
	name: String,
});
export default mongoose.model('User', userSchema);
// ...existing code from idea-app/backend/src/models/User.js...