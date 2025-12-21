import { generateEmbedding } from './watsonService.js';
import mongoose from 'mongoose';

// Knowledge Base Schema for RAG
const KnowledgeBaseSchema = new mongoose.Schema({
	content: { type: String, required: true },
	embedding: { type: [Number], required: true },
	metadata: {
		source: String,
		category: String,
		domain: String,
		timestamp: { type: Date, default: Date.now },
	},
});

// Index for vector similarity search
KnowledgeBaseSchema.index({ embedding: '2dsphere' });

const KnowledgeBase = mongoose.model('KnowledgeBase', KnowledgeBaseSchema);

/**
 * Add document to knowledge base with embeddings
 * @param {string} content - Text content to store
 * @param {object} metadata - Additional metadata
 */
export async function addToKnowledgeBase(content, metadata = {}) {
	try {
		const embedding = await generateEmbedding(content);

		const document = new KnowledgeBase({
			content,
			embedding,
			metadata,
		});

		await document.save();
		return document;
	} catch (error) {
		console.error('Error adding to knowledge base:', error);
		throw error;
	}
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
	const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
	const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
	const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
	return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Search knowledge base for relevant documents
 * @param {string} query - Search query
 * @param {number} topK - Number of top results to return
 * @returns {Promise<Array>} - Array of relevant documents
 */
export async function searchKnowledgeBase(query, topK = 5) {
	try {
		const queryEmbedding = await generateEmbedding(query);

		// Get all documents (in production, use vector DB like Pinecone)
		const allDocs = await KnowledgeBase.find({});

		// Calculate similarity scores
		const scoredDocs = allDocs.map((doc) => ({
			...doc.toObject(),
			score: cosineSimilarity(queryEmbedding, doc.embedding),
		}));

		// Sort by score and return top K
		scoredDocs.sort((a, b) => b.score - a.score);
		return scoredDocs.slice(0, topK);
	} catch (error) {
		// If embeddings fail (e.g., quota), fall back to empty context so downstream can still respond
		console.error('Error searching knowledge base, returning empty context:', error.message);
		return [];
	}
}

/**
 * Generate RAG-enhanced response
 * @param {string} query - User query
 * @param {object} options - Additional options
 * @returns {Promise<object>} - Response with context
 */
export async function ragQuery(query, options = {}) {
	try {
		// Search for relevant context
		const relevantDocs = await searchKnowledgeBase(query, options.topK || 3);

		// Build context from relevant documents
		const context = relevantDocs
			.map((doc, i) => `[Context ${i + 1}]: ${doc.content}`)
			.join('\n\n');

		return {
			query,
			context,
			relevantDocs: relevantDocs.map((doc) => ({
				content: doc.content,
				score: doc.score,
				metadata: doc.metadata,
			})),
		};
	} catch (error) {
		// Provide empty context so callers can proceed
		console.error('Error in RAG query, using empty context:', error.message);
		return { query, context: '', relevantDocs: [] };
	}
}

/**
 * Initialize knowledge base with startup data
 */
export async function initializeKnowledgeBase() {
	try {
		if (process.env.RAG_SKIP_SEED === 'true') {
			console.warn('Skipping knowledge base seeding because RAG_SKIP_SEED=true');
			return;
		}

		const count = await KnowledgeBase.countDocuments();
		if (count > 0) {
			console.log('Knowledge base already initialized with', count, 'documents');
			return;
		}

		// Seed with initial business and startup knowledge
		const seedData = [
			{
				content: 'A strong business idea should solve a real problem, have a clear target market, and offer a unique value proposition.',
				metadata: { category: 'business-fundamentals', domain: 'general' },
			},
			{
				content: 'Project roadmaps should include clear milestones, timelines, resource allocation, and risk assessment. Break down work into phases: Planning, Development, Testing, and Launch.',
				metadata: { category: 'project-management', domain: 'general' },
			},
			{
				content: 'An effective pitch deck includes: Problem, Solution, Market Size, Business Model, Competitive Advantage, Team, Financial Projections, and Ask.',
				metadata: { category: 'pitch-deck', domain: 'fundraising' },
			},
			{
				content: 'Tech startup ideas should leverage emerging technologies like AI, blockchain, IoT, or cloud computing to create scalable solutions.',
				metadata: { category: 'business-ideas', domain: 'tech' },
			},
			{
				content: 'Market validation is crucial. Use surveys, interviews, and MVP testing to validate demand before building a full product.',
				metadata: { category: 'validation', domain: 'general' },
			},
			{
				content: 'A minimum viable product (MVP) should focus on core features that solve the main problem with minimum resources.',
				metadata: { category: 'mvp', domain: 'product' },
			},
		];

		for (const data of seedData) {
			try {
				await addToKnowledgeBase(data.content, data.metadata);
			} catch (error) {
				// If embedding fails (e.g., quota), log and continue to avoid failing startup
				console.error('Seeding skipped for one item:', error.message);
			}
		}

		console.log('Knowledge base initialized with', seedData.length, 'seed documents');
	} catch (error) {
		console.error('Error initializing knowledge base:', error);
	}
}

export { KnowledgeBase };
