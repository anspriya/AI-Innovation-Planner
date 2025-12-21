import express from 'express';
import Idea from '../models/Idea.js';
import auth from '../middleware/auth.js';
const router = express.Router();

// Generate idea suggestions (stub)
router.post('/', auth, async (req, res) => {
	// TODO: Generate ideas based on trends
	const { domain, region, keywords } = req.body;
	// For demo, return static ideas
	res.json([
		{ title: 'AI Startup', description: 'AI for ' + domain, score: 90, domain },
		{ title: 'Eco App', description: 'Eco for ' + region, score: 80, domain },
	]);
});

// Save scored/favorite ideas (supports ideas, roadmaps, pitch decks)
router.post('/save', auth, async (req, res) => {
	try {
		const { title, description, score, domain, saved, roadmap, pitchDeck, ideas, targetMarket, businessModel, competitiveAdvantage, fundingGoal, _mergeTitle } = req.body;
		
		// Validate required fields
		if (!title) {
			return res.status(400).json({ success: false, error: 'Title is required' });
		}

		console.log('💾 Saving idea for user:', req.user.id);
		console.log('💾 Data:', { title, domain, hasRoadmap: !!roadmap, hasPitchDeck: !!pitchDeck, hasIdeas: !!ideas });
		console.log('💾 MongoDB connection state:', Idea.db?.readyState); // 1 = connected, 0 = disconnected
		
		// Check if MongoDB is connected
		if (!Idea.db || Idea.db.readyState !== 1) {
			console.error('❌ MongoDB not connected! State:', Idea.db?.readyState);
			return res.status(500).json({ 
				success: false, 
				error: 'Database connection error',
				details: 'MongoDB is not connected'
			});
		}
		
		// If merging, find existing idea by title and user and update it
		let idea;
		if (_mergeTitle) {
			const updateData = {};
			if (description) updateData.description = description;
			if (roadmap) updateData.roadmap = roadmap;
			if (pitchDeck) updateData.pitchDeck = pitchDeck;
			if (ideas) updateData.ideas = ideas;
			if (targetMarket) updateData.targetMarket = targetMarket;
			if (businessModel) updateData.businessModel = businessModel;
			if (competitiveAdvantage) updateData.competitiveAdvantage = competitiveAdvantage;
			if (fundingGoal) updateData.fundingGoal = fundingGoal;
			updateData.saved = true;
			
			idea = await Idea.findOneAndUpdate(
				{ user: req.user.id, title: _mergeTitle },
				updateData,
				{ upsert: true, new: true }
			);
			console.log('✅ Idea merged/updated:', idea._id);
		} else {
			idea = await Idea.create({ 
				title: title || 'Untitled Idea', 
				description: description || '', 
				score: score || 0, 
				domain: domain || 'General', 
				saved: true, // Always set to true when saving
				user: req.user.id,
				roadmap,
				pitchDeck,
				ideas,
				targetMarket,
				businessModel,
				competitiveAdvantage,
				fundingGoal,
			});
		}
		console.log('✅ Idea saved successfully:', idea._id);
		console.log('✅ Saved to database:', idea.title);
		res.json({ success: true, idea });
	} catch (error) {
		console.error('Save idea error:', error);
		res.status(500).json({ success: false, error: error.message });
	}
});

// Get user's saved ideas (favorites)
router.get('/favorites', auth, async (req, res) => {
	try {
		console.log('📖 Fetching favorites for user:', req.user.id);
		console.log('📖 User object:', JSON.stringify(req.user));
		
		// Check total ideas for this user
		const allUserIdeas = await Idea.find({ user: req.user.id });
		console.log('📊 Total ideas for user:', allUserIdeas.length);
		
		const ideas = await Idea.find({ user: req.user.id, saved: true }).sort({ createdAt: -1 });
		console.log('✅ Found', ideas.length, 'saved ideas');
		
		if (ideas.length > 0) {
			console.log('📋 Sample idea:', { 
				title: ideas[0].title, 
				saved: ideas[0].saved, 
				user: ideas[0].user 
			});
		}
		
		res.json(ideas);
	} catch (error) {
		console.error('❌ Fetch favorites error:', error);
		res.status(500).json({ error: error.message });
	}
});

// Get ALL user's ideas (including unsaved)
router.get('/', auth, async (req, res) => {
	try {
		console.log('📖 Fetching all ideas for user:', req.user.id);
		const ideas = await Idea.find({ user: req.user.id }).sort({ createdAt: -1 });
		console.log('✅ Found', ideas.length, 'total ideas');
		res.json(ideas);
	} catch (error) {
		console.error('❌ Fetch ideas error:', error);
		res.status(500).json({ error: error.message });
	}
});

export default router;
// ...existing code from idea-app/backend/src/routes/ideas.js...