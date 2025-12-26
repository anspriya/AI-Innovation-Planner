import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import ideasRoutes from './routes/ideas.js';
import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';
import { initializeKnowledgeBase } from './services/ragService.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Connect to MongoDB
connectDB(process.env.MONGODB_URI || 'mongodb://localhost:27017/smartideafinder');

// Initialize RAG knowledge base (optional)
if (process.env.RAG_SKIP_SEED === 'true') {
	console.log('⚙️  RAG seeding skipped (RAG_SKIP_SEED=true)');
} else {
	initializeKnowledgeBase().catch(console.error);
}

// API routes
app.use('/api/ideas', ideasRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Google Trends API
import googleTrends from 'google-trends-api';

// Trends endpoint with real Google Trends API
app.get('/api/trends', async (req, res) => {
	try {
		const { domain = 'Technology', keywords = 'AI', region = 'US' } = req.query;
		
		console.log('🔍 Fetching Google Trends for:', keywords, 'in', region);
		
		// Get real-time interest over time
		const interestOverTime = await googleTrends.interestOverTime({
			keyword: keywords,
			startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
			geo: region === 'Global' ? '' : region,
		});
		
		// Get related queries
		const relatedQueries = await googleTrends.relatedQueries({
			keyword: keywords,
			startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
			geo: region === 'Global' ? '' : region,
		});
		
		// Parse the JSON responses
		const timeData = JSON.parse(interestOverTime);
		const queriesData = JSON.parse(relatedQueries);
		
		// Extract top and rising queries
		const top = queriesData.default?.rankedList?.[0]?.rankedKeyword?.map(item => ({
			name: item.query,
			value: item.value
		})) || [];
		
		const rising = queriesData.default?.rankedList?.[1]?.rankedKeyword?.map(item => ({
			name: item.query,
			value: item.formattedValue || item.value
		})) || [];
		
		// Extract timeline data
		const timeline = timeData.default?.timelineData?.map(point => ({
			time: point.formattedTime,
			value: point.value?.[0] || 0
		})) || [];
		
		console.log('✅ Google Trends fetched:', top.length, 'top queries,', rising.length, 'rising queries');
		
		res.json({ 
			success: true,
			trends: { top, rising, timeline },
			keyword: keywords,
			region: region
		});
		
	} catch (err) {
		console.error('❌ Google Trends API Error:', err.message);
		
		// Fallback to CSV data if API fails
		const __dirname = path.dirname(new URL(import.meta.url).pathname.replace(/^\//, ''));
		const filePath = path.resolve(__dirname, '../data/relatedQueries.csv');
		try {
			console.log('⚠️ Using fallback CSV data');
			const csv = fs.readFileSync(filePath, 'utf8');
			const lines = csv.split(/\r?\n/);
			let section = '';
			const top = [];
			const rising = [];
			for (const line of lines) {
				if (line.trim() === 'TOP') {
					section = 'TOP';
					continue;
				}
				if (line.trim() === 'RISING') {
					section = 'RISING';
					continue;
				}
				if (section === 'TOP' && line.trim()) {
					const [name, value] = line.split(',');
					if (name && value) {
						top.push({ name: name.trim(), value: Number(value.trim()) });
					}
				}
				if (section === 'RISING' && line.trim()) {
					const [name, value] = line.split(',');
					if (name && value) {
						rising.push({ name: name.trim(), value: value.trim() });
					}
				}
			}
			res.json({ success: true, trends: { top, rising }, fallback: true });
		} catch (csvErr) {
			console.error('❌ CSV fallback also failed:', csvErr.message);
			res.status(500).json({ 
				success: false,
				error: 'Failed to fetch trends', 
				details: err.message 
			});
		}
	}
});

// Export endpoint (stub)
import pdfkit from 'pdfkit';

app.post('/api/export', async (req, res) => {
	// Accepts ideas in req.body (array of idea objects)
	const ideas = req.body.ideas;
	if (!Array.isArray(ideas) || ideas.length === 0) {
		return res.status(400).json({ error: 'No ideas provided for export.' });
	}
	try {
		// Create PDF document
		const doc = new pdfkit();
		let buffers = [];
		doc.on('data', buffers.push.bind(buffers));
		doc.on('end', () => {
			const pdfData = Buffer.concat(buffers);
			res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="ideas.pdf"' });
			res.send(pdfData);
		});
		
		doc.fontSize(20).text('Smart Idea Finder - Exported Ideas', { align: 'center' });
		doc.moveDown();
		
		ideas.forEach((idea, idx) => {
			// Title and basic info
			doc.fontSize(14).text(`${idx + 1}. ${idea.title}`, { underline: true });
			doc.fontSize(11).text(`Domain: ${idea.domain || 'N/A'} | Score: ${idea.score || 'N/A'}`);
			
			// Description
			if (idea.description) {
				doc.fontSize(11).text(`Description: ${idea.description}`);
			}
			doc.moveDown(0.5);
			
			// Pitch Deck Content
			if (idea.pitchDeck && idea.pitchDeck.slides && Array.isArray(idea.pitchDeck.slides)) {
				doc.fontSize(12).text('PITCH DECK SLIDES:', { underline: true });
				idea.pitchDeck.slides.forEach((slide, sidx) => {
					const slideTitle = slide.headline || slide.title || `Slide ${sidx + 1}`;
					doc.fontSize(10).text(`Slide ${sidx + 1}: ${slideTitle}`);
					if (slide.keyPoints && Array.isArray(slide.keyPoints)) {
						slide.keyPoints.slice(0, 3).forEach(pt => {
							doc.fontSize(9).text(`  - ${pt}`, { indent: 10 });
						});
					}
				});
				doc.moveDown(0.5);
			}
			
			// Roadmap Content
			if (idea.roadmap && (idea.roadmap.Phases || idea.roadmap.phases || idea.roadmap.Milestones || idea.roadmap.milestones)) {
				doc.fontSize(12).text('ROADMAP:', { underline: true });
				
				// Phases
				const phases = idea.roadmap.Phases || idea.roadmap.phases || [];
				if (Array.isArray(phases) && phases.length > 0) {
					doc.fontSize(10).text('Phases:');
					phases.forEach(phase => {
						const phaseName = typeof phase === 'string' ? phase : (phase.title || phase.name || 'Phase');
						const phaseDuration = typeof phase === 'string' ? '' : (phase.duration || '');
						doc.fontSize(9).text(`  - ${phaseName}${phaseDuration ? ` (${phaseDuration})` : ''}`, { indent: 10 });
					});
				}
				
				// Milestones
				const milestones = idea.roadmap.Milestones || idea.roadmap.milestones || [];
				if (Array.isArray(milestones) && milestones.length > 0) {
					doc.fontSize(10).text('Key Milestones:');
					milestones.slice(0, 5).forEach(ms => {
						const milestoneName = typeof ms === 'string' ? ms : (ms.name || ms.milestone || ms.Milestone || 'Milestone');
						const milestoneDate = typeof ms === 'string' ? '' : (ms.targetDate || ms.date || ms['Target Date'] || '');
						doc.fontSize(9).text(`  - ${milestoneName}${milestoneDate ? ` - ${milestoneDate}` : ''}`, { indent: 10 });
					});
				}
				doc.moveDown(0.5);
			}
			
			// Generated Ideas Array
			if (idea.ideas && Array.isArray(idea.ideas) && idea.ideas.length > 0) {
				doc.fontSize(12).text('GENERATED IDEAS:', { underline: true });
				idea.ideas.forEach((ai, aiidx) => {
					const aiTitle = typeof ai === 'string' ? ai : (ai.title || `Idea ${aiidx + 1}`);
					const aiScore = typeof ai === 'string' ? '' : (ai.score ? ` (Score: ${ai.score})` : '');
					doc.fontSize(9).text(`  ${aiidx + 1}. ${aiTitle}${aiScore}`, { indent: 10 });
				});
				doc.moveDown(0.5);
			}
			
			// Separator
			doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
			doc.moveDown();
		});
		
		doc.end();
	} catch (err) {
		console.error('Export error:', err);
		res.status(500).json({ error: 'Failed to generate PDF', details: err.message });
	}
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
