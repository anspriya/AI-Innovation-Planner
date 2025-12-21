import mongoose from 'mongoose';
const ideaSchema = new mongoose.Schema({
	title: String,
	description: String,
	score: Number,
	domain: String,
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	saved: { type: Boolean, default: false },
	// Extended fields for roadmap and pitch deck
	roadmap: mongoose.Schema.Types.Mixed,
	pitchDeck: mongoose.Schema.Types.Mixed,
	ideas: mongoose.Schema.Types.Mixed, // For storing generated ideas array
	targetMarket: String,
	businessModel: String,
	competitiveAdvantage: String,
	fundingGoal: String,
	createdAt: { type: Date, default: Date.now },
});
export default mongoose.model('Idea', ideaSchema);