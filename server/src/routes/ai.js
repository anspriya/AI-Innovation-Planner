import express from 'express';
import { generateCompletion } from '../services/watsonService.js';
import { ragQuery } from '../services/ragService.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Offline fallback ideas when OpenAI is unavailable
function buildFallbackIdeas({ domain = 'General', keywords = '', region = 'Global' }) {
	const base = keywords || domain;
	return [
		{
			title: `${base} automation platform`,
			description: `A practical tool that automates repetitive workflows in the ${domain} space for ${region} teams. Ships with templates and human-in-the-loop review.`,
			targetMarket: 'SMBs and startups',
			uniqueValue: 'Ops-friendly setup, no-code builder, audit trails',
			challenges: 'Distribution, data access, change management',
			marketSize: 'Mid-sized and growing',
			score: 7,
		},
		{
			title: `${base} insights co-pilot`,
			description: `An insights layer that aggregates signals (support, CRM, product usage) to suggest next-best-actions in ${domain}.` ,
			targetMarket: 'Product and growth teams',
			uniqueValue: 'Connectors first, fast dashboards, alerting',
			challenges: 'Data quality, integrations coverage',
			marketSize: 'Large and horizontal',
			score: 8,
		},
		{
			title: `${base} marketplace`,
			description: `Curate a niche marketplace in ${domain} with vetted vendors and transparent pricing for ${region} buyers.`,
			targetMarket: 'Procurement leads and founders',
			uniqueValue: 'Curation + buyer playbooks',
			challenges: 'Trust, supply density, take-rate sustainability',
			marketSize: 'Dependent on niche depth',
			score: 6,
		},
	];
}

/**
 * POST /api/ai/generate-idea
 * Generate AI-powered business ideas based on trends and user input
 */
router.post('/generate-idea', auth, async (req, res) => {
	try {
		const { domain, keywords, region, trends, constraints } = req.body;

		// Skip RAG if embeddings are disabled (quota issues)
		const ragContext = process.env.RAG_SKIP_SEED === 'true' 
			? { context: '', relevantDocs: [] }
			: await ragQuery(`business ideas for ${domain} domain with keywords: ${keywords}`);

		// Build comprehensive prompt
		const prompt = `Generate 5 innovative business ideas based on the following:

Domain: ${domain}
Keywords: ${keywords}
Region: ${region || 'Global'}
${trends ? `Current Trends: ${JSON.stringify(trends)}` : ''}
${constraints ? `Constraints/Requirements: ${constraints}` : ''}

Context from knowledge base:
${ragContext.context}

For each idea, provide:
1. Title (catchy and descriptive)
2. Description (2-3 sentences explaining the concept)
3. Target Market (who would use this)
4. Unique Value Proposition (what makes it special)
5. Potential Challenges
6. Estimated Market Size
7. Innovation Score (1-10)

Format the response as a JSON array of idea objects.`;

		const aiResponse = await generateCompletion(prompt, {
			temperature: 0.8,
			max_tokens: 4000,
		});

		// Parse AI response
		let ideas;
		try {
			console.log('🔵 Raw AI Response:', aiResponse.substring(0, 200));
			
			// Clean up Watson response - remove markdown code blocks and extra quotes
			let cleanResponse = aiResponse
				.replace(/```json\s*/g, '')  // Remove ```json
				.replace(/```\s*/g, '')      // Remove ```
				.replace(/^["']+/g, '')      // Remove leading quotes
				.replace(/["']+$/g, '')      // Remove trailing quotes
				.trim();
			
			console.log('🔵 Cleaned Response:', cleanResponse.substring(0, 200));
			
			// Extract the first complete JSON array from the response
			// Watson sometimes generates multiple JSON arrays - we only want the first one
			const firstArrayStart = cleanResponse.indexOf('[');
			if (firstArrayStart === -1) {
				throw new Error('No JSON array found in response');
			}
			
			// Find the matching closing bracket for the first array
			let bracketCount = 0;
			let firstArrayEnd = -1;
			for (let i = firstArrayStart; i < cleanResponse.length; i++) {
				if (cleanResponse[i] === '[') bracketCount++;
				if (cleanResponse[i] === ']') {
					bracketCount--;
					if (bracketCount === 0) {
						firstArrayEnd = i + 1;
						break;
					}
				}
			}
			
			if (firstArrayEnd === -1) {
				// JSON might be truncated, try to close it
				console.log('⚠️ JSON array appears truncated, attempting to fix...');
				const truncatedJson = cleanResponse.substring(firstArrayStart);
				
				// Try to find the last complete object and close the array
				const lastCompleteObject = truncatedJson.lastIndexOf('}');
				if (lastCompleteObject !== -1) {
					cleanResponse = truncatedJson.substring(0, lastCompleteObject + 1) + '\n]';
					firstArrayEnd = cleanResponse.length;
				} else {
					throw new Error('Could not find complete JSON structure');
				}
			}
			
			const firstJsonArray = cleanResponse.substring(firstArrayStart, firstArrayEnd);
			console.log('🔵 Extracted first JSON array (length:', firstJsonArray.length, ')');
			
			ideas = JSON.parse(firstJsonArray);
			console.log('✅ Parsed ideas:', ideas.length, 'ideas found');
			
			// Normalize field names (Watson returns Title, Description, etc. but frontend expects lowercase)
			ideas = ideas.map(idea => ({
				title: idea.Title || idea.title,
				description: idea.Description || idea.description,
				targetMarket: idea['Target Market'] || idea.targetMarket,
				uniqueValueProposition: idea['Unique Value Proposition'] || idea.uniqueValueProposition,
				potentialChallenges: idea['Potential Challenges'] || idea.potentialChallenges,
				estimatedMarketSize: idea['Estimated Market Size'] || idea.estimatedMarketSize,
				innovationScore: idea['Innovation Score'] || idea.innovationScore || idea.score,
			}));
		} catch (parseError) {
			console.error('❌ Parse error:', parseError.message);
			console.log('🔵 Failed response length:', aiResponse.length);
			console.log('🔵 Response preview:', aiResponse.substring(0, 500));
			// Return user-friendly error instead of raw JSON
			ideas = [
				{
					title: 'Parsing Error',
					description: 'The AI generated ideas but they could not be parsed. Please try generating again.',
					rawResponse: true,
				},
			];
			console.error('❌ Returning error placeholder');
		}

		res.json({
			success: true,
			ideas,
			context: ragContext.relevantDocs,
			timestamp: new Date(),
		});
	} catch (error) {
		console.error('AI Idea Generation Error:', error);
		const message = (error?.message || '').toLowerCase();
		if (
			message.includes('quota') ||
			message.includes('insufficient') ||
			message.includes('embedding') ||
			message.includes('openai') ||
			message.includes('watson') ||
			message.includes('404') ||
			message.includes('failed to generate')
		) {
			return res.status(200).json({
				success: true,
				ideas: buildFallbackIdeas(req.body),
				context: [],
				fallback: true,
				warning: 'OpenAI unavailable; showing fallback ideas.',
			});
		}
		res.status(500).json({
			success: false,
			error: 'Failed to generate ideas',
			message: error.message,
		});
	}
});

/**
 * POST /api/ai/generate-roadmap
 * Generate project roadmap for a business idea
 */
router.post('/generate-roadmap', auth, async (req, res) => {
	try {
		const { ideaTitle, ideaDescription, timeline, teamSize, budget } = req.body;

		// Skip RAG if embeddings are disabled (quota issues)
		const ragContext = process.env.RAG_SKIP_SEED === 'true'
			? { context: '', relevantDocs: [] }
			: await ragQuery(`project roadmap planning for ${ideaTitle} with timeline ${timeline}`);

		const prompt = `Create a detailed project roadmap for the following business idea:

Title: ${ideaTitle}
Description: ${ideaDescription}
Timeline: ${timeline || '6 months'}
Team Size: ${teamSize || 'Small (3-5 people)'}
Budget: ${budget || 'Bootstrapped'}

Context from knowledge base:
${ragContext.context}

Generate a comprehensive roadmap with:

1. **Phases**: Break down into 4-6 major phases (e.g., Planning, MVP Development, Testing, Launch, Growth)

2. **For each phase, include:**
   - Phase name and duration
   - Key objectives
   - Deliverables/Milestones
   - Required resources
   - Success metrics
   - Potential risks

3. **Key Milestones**: List 8-10 critical milestones with target dates

4. **Resource Allocation**: Breakdown by role/function

5. **Dependencies**: Critical path items

6. **Risk Management**: Top 5 risks and mitigation strategies

Format as a structured JSON object with phases, milestones, resources, and risks.`;

		const aiResponse = await generateCompletion(prompt, {
			temperature: 0.7,
			max_tokens: 3000,
		});

		// Parse response
		let roadmap;
		try {
			console.log('🔵 Raw Roadmap Response:', aiResponse.substring(0, 200));
			
			// Remove markdown code blocks
			let text = aiResponse
				.replace(/```json\s*/g, '')
				.replace(/```\s*/g, '')
				.trim();
			
			// Function to extract JSON from text using bracket counting (same as pitch deck)
			function extractJSON(text) {
				const results = [];
				let i = 0;
				
				while (i < text.length) {
					// Find next [ or {
					const nextBracket = text.indexOf('[', i);
					const nextBrace = text.indexOf('{', i);
					
					let start = -1;
					if (nextBracket === -1 && nextBrace === -1) break;
					if (nextBracket === -1) start = nextBrace;
					else if (nextBrace === -1) start = nextBracket;
					else start = Math.min(nextBracket, nextBrace);
					
					if (start === -1) break;
					
					// Count brackets/braces to find the end
					let bracketCount = 0;
					let braceCount = 0;
					let inString = false;
					let escapeNext = false;
					let end = -1;
					
					for (let j = start; j < text.length; j++) {
						const char = text[j];
						
						if (escapeNext) {
							escapeNext = false;
							continue;
						}
						
						if (char === '\\' && inString) {
							escapeNext = true;
							continue;
						}
						
						if (char === '"') {
							inString = !inString;
							continue;
						}
						
						if (inString) continue;
						
						if (char === '[') bracketCount++;
						else if (char === ']') {
							bracketCount--;
							if (bracketCount === 0 && braceCount === 0) {
								end = j + 1;
								break;
							}
						}
						else if (char === '{') braceCount++;
						else if (char === '}') {
							braceCount--;
							if (bracketCount === 0 && braceCount === 0) {
								end = j + 1;
								break;
							}
						}
					}
					
					if (end === -1) break;
					
					const jsonStr = text.substring(start, end);
					results.push(jsonStr);
					i = end;
				}
				
				return results;
			}
			
			const jsonBlocks = extractJSON(text);
			console.log(`🔵 Found ${jsonBlocks.length} JSON blocks`);
			
			let parsed = null;
			for (let i = 0; i < jsonBlocks.length; i++) {
				let block = jsonBlocks[i];
				
				// Remove comments
				block = block
					.replace(/\/\/.*$/gm, '')
					.replace(/\/\*[\s\S]*?\*\//g, '')
					.trim();
				
				try {
					parsed = JSON.parse(block);
					console.log(`✅ Successfully parsed JSON block ${i + 1}`);
					break;
				} catch (e) {
					console.log(`⚠️  Block ${i + 1} parse error:`, e.message.substring(0, 60));
				}
			}
			
			if (!parsed) {
				throw new Error(`Could not parse any of ${jsonBlocks.length} JSON blocks`);
			}
			
			// Extract fields based on what Watson returned
			roadmap = parsed;
			
			// Normalize structure - Watson might return under "Project Roadmap" key
			if (parsed['Project Roadmap']) {
				roadmap = parsed['Project Roadmap'];
			}
			
			// Normalize phases
			if (Array.isArray(roadmap.Phases)) {
				roadmap.Phases = roadmap.Phases.map(phase => ({
					title: phase.Title || phase.title || phase.Phase || 'Phase',
					duration: phase.Duration || phase.duration || phase['Duration/Timeline'] || 'TBD',
					objectives: phase['Key Objectives'] || phase.objectives || phase['key_objectives'] || [],
					deliverables: phase['Deliverables/Milestones'] || phase.deliverables || phase['Deliverables'] || [],
					resources: phase['Required Resources'] || phase.resources || phase['required_resources'] || [],
					successMetrics: phase['Success Metrics'] || phase['success_metrics'] || [],
					risks: phase['Potential Risks'] || phase.risks || phase['Potential Risks'] || []
				}));
			}
			
			// Normalize milestones
			if (Array.isArray(roadmap.Milestones)) {
				roadmap.Milestones = roadmap.Milestones.map(m => ({
					name: m.Milestone || m.milestone || m.name || 'Milestone',
					targetDate: m['Target Date'] || m['target_date'] || m.date || '',
					description: m.Description || m.description || ''
				}));
			} else if (Array.isArray(roadmap['Key Milestones'])) {
				roadmap.Milestones = roadmap['Key Milestones'].map(m => ({
					name: m.Milestone || m.milestone || m.name || 'Milestone',
					targetDate: m['Target Date'] || m['target_date'] || m.date || '',
					description: m.Description || m.description || ''
				}));
			}
			
			console.log('✅ Roadmap parsed successfully:', {
				phases: roadmap.Phases?.length || 0,
				milestones: roadmap.Milestones?.length || 0
			});
			
		} catch (parseError) {
			console.error('❌ Roadmap parse error:', parseError.message);
			roadmap = {
				rawContent: aiResponse,
				parseError: true,
			};
		}

		res.json({
			success: true,
			roadmap,
			context: ragContext.relevantDocs,
			timestamp: new Date(),
		});
	} catch (error) {
		console.error('Roadmap Generation Error:', error);
		const message = (error?.message || '').toLowerCase();
		if (
			message.includes('quota') ||
			message.includes('insufficient') ||
			message.includes('embedding') ||
			message.includes('openai') ||
			message.includes('watson') ||
			message.includes('404') ||
			message.includes('failed to generate')
		) {
			return res.status(200).json({
				success: true,
				roadmap: {
					phases: [
						{ name: 'Planning', duration: '2 weeks', objectives: ['Define scope', 'Set up team'] },
						{ name: 'Development', duration: '8 weeks', objectives: ['Build MVP', 'Iterate'] },
						{ name: 'Testing', duration: '2 weeks', objectives: ['QA', 'Bug fixes'] },
						{ name: 'Launch', duration: '1 week', objectives: ['Release', 'Monitor'] },
					],
					milestones: [
						'Week 1: Team kickoff',
						'Week 3: MVP ready',
						'Week 10: Testing begins',
						'Week 12: Launch',
					],
				},
				context: [],
				fallback: true,
				warning: 'OpenAI unavailable; showing basic roadmap template.',
			});
		}
		res.status(500).json({
			success: false,
			error: 'Failed to generate roadmap',
			message: error.message,
		});
	}
});

/**
 * POST /api/ai/generate-pitch-deck
 * Generate pitch deck content for a business idea
 */
router.post('/generate-pitch-deck', auth, async (req, res) => {
	try {
		const {
			ideaTitle,
			ideaDescription,
			targetMarket,
			businessModel,
			competitiveAdvantage,
			fundingGoal,
		} = req.body;

		// Skip RAG if embeddings are disabled (quota issues)
		const ragContext = process.env.RAG_SKIP_SEED === 'true'
			? { context: '', relevantDocs: [] }
			: await ragQuery(`pitch deck content for ${ideaTitle} startup fundraising`);

		const prompt = `Create compelling pitch deck content for the following startup:

Title: ${ideaTitle}
Description: ${ideaDescription}
Target Market: ${targetMarket || 'To be defined'}
Business Model: ${businessModel || 'To be defined'}
Competitive Advantage: ${competitiveAdvantage || 'To be defined'}
Funding Goal: ${fundingGoal || '$500K seed round'}

Context from knowledge base:
${ragContext.context}

Generate content for a 10-12 slide pitch deck with the following sections:

1. **Cover Slide**: Company name, tagline, and positioning statement
2. **Problem**: What problem are we solving? (include statistics if possible)
3. **Solution**: Our unique solution and how it works
4. **Market Opportunity**: TAM, SAM, SOM analysis
5. **Product/Service**: Key features and benefits
6. **Business Model**: How we make money
7. **Traction**: Milestones achieved or planned
8. **Competition**: Competitive landscape and our advantage
9. **Go-to-Market Strategy**: How we'll acquire customers
10. **Team**: Key team members and advisors (template)
11. **Financial Projections**: 3-year revenue projection
12. **Ask**: Funding amount and use of funds

For each slide, provide:
- Headline
- Key points (3-5 bullet points)
- Supporting data or statistics
- Visual suggestions

Format as a JSON object with slides array.`;

		const aiResponse = await generateCompletion(prompt, {
			temperature: 0.7,
			max_tokens: 3500,
		});

		// Parse response
		let pitchDeck;
		try {
			console.log('🔵 Raw Pitch Deck Response:', aiResponse.substring(0, 150));
			
			// Remove markdown code blocks
			let text = aiResponse
				.replace(/```json\s*/g, '')
				.replace(/```\s*/g, '')
				.trim();
			
			// Function to extract JSON from text using bracket counting
			function extractJSON(text) {
				const results = [];
				let i = 0;
				
				while (i < text.length) {
					// Find next [ or {
					const nextBracket = text.indexOf('[', i);
					const nextBrace = text.indexOf('{', i);
					
					let start = -1;
					if (nextBracket === -1 && nextBrace === -1) break;
					if (nextBracket === -1) start = nextBrace;
					else if (nextBrace === -1) start = nextBracket;
					else start = Math.min(nextBracket, nextBrace);
					
					if (start === -1) break;
					
					// Count brackets/braces to find the end
					let bracketCount = 0;
					let braceCount = 0;
					let inString = false;
					let escapeNext = false;
					let end = -1;
					
					for (let j = start; j < text.length; j++) {
						const char = text[j];
						
						if (escapeNext) {
							escapeNext = false;
							continue;
						}
						
						if (char === '\\' && inString) {
							escapeNext = true;
							continue;
						}
						
						if (char === '"') {
							inString = !inString;
							continue;
						}
						
						if (inString) continue;
						
						if (char === '[') bracketCount++;
						else if (char === ']') {
							bracketCount--;
							if (bracketCount === 0 && braceCount === 0) {
								end = j + 1;
								break;
							}
						}
						else if (char === '{') braceCount++;
						else if (char === '}') {
							braceCount--;
							if (bracketCount === 0 && braceCount === 0) {
								end = j + 1;
								break;
							}
						}
					}
					
					if (end === -1) break;
					
					const jsonStr = text.substring(start, end);
					results.push(jsonStr);
					i = end;
				}
				
				return results;
			}
			
			const jsonBlocks = extractJSON(text);
			console.log(`🔵 Found ${jsonBlocks.length} JSON blocks`);
			
			let parsed = null;
			for (let i = 0; i < jsonBlocks.length; i++) {
				let block = jsonBlocks[i];
				
				// Remove comments
				block = block
					.replace(/\/\/.*$/gm, '')
					.replace(/\/\*[\s\S]*?\*\//g, '')
					.trim();
				
				try {
					parsed = JSON.parse(block);
					console.log(`✅ Successfully parsed JSON block ${i + 1}`);
					break;
				} catch (e) {
					console.log(`⚠️  Block ${i + 1} parse error:`, e.message.substring(0, 60));
				}
			}
			
			if (!parsed) {
				throw new Error(`Could not parse any of ${jsonBlocks.length} JSON blocks`);
			}
			
			console.log('✅ Parsed pitch deck structure:', Array.isArray(parsed) ? 'array' : typeof parsed);
			console.log('📊 Parsed content:', JSON.stringify(parsed).substring(0, 200));
			
			// Convert to slides array
			let slides = [];
			
			// Check if parsed has a pitch_deck property with slides
			if (parsed.pitch_deck && Array.isArray(parsed.pitch_deck)) {
				slides = parsed.pitch_deck.map((item, idx) => ({
					title: item.title || item.Title || `Slide ${idx + 1}`,
					headline: item.headline || item.Headline || item.title || '',
					keyPoints: item.key_points || item['Key Points'] || item.keyPoints || [],
					supportingData: item.supporting_data || item['Supporting Data'] || item.supportingData || '',
					visualSuggestion: item.visual_suggestions || item['Visual Suggestions'] || item.visualSuggestion || item.visual_suggestion || '',
					...item
				}));
			} else if (parsed.Slides && Array.isArray(parsed.Slides)) {
				// Watson returns {"Slides": [{"Slide 1: Cover Slide": {...}}, {"Slide 2: Problem": {...}}]}
				slides = parsed.Slides.map((item, idx) => {
					// Each item is {"Slide N: Title": {...slideData}}
					const slideKey = Object.keys(item).find(k => k.includes('Slide'));
					if (slideKey) {
						const slideData = item[slideKey];
						return {
							title: slideKey,
							headline: slideData.Headline || slideData.headline || slideKey,
							keyPoints: slideData['Key Points'] || slideData.keyPoints || [],
							supportingData: slideData['Supporting Data'] || slideData.supportingData || '',
							visualSuggestion: slideData['Visual Suggestions'] || slideData['Visual Suggestion'] || slideData.visualSuggestion || '',
							...slideData
						};
					}
					// Fallback
					return {
						title: item.title || `Slide ${idx + 1}`,
						headline: item.headline || '',
						keyPoints: item.keyPoints || [],
						supportingData: item.supportingData || '',
						visualSuggestion: item.visualSuggestion || ''
					};
				});
			} else if (Array.isArray(parsed)) {
				// Watson returns [{ "Slide 1: ...": {...}, "Slide 2: ...": {...} }]
				if (parsed.length > 0 && typeof parsed[0] === 'object') {
					const firstItem = parsed[0];
					// Check if first item has slide properties
					const slideKeys = Object.keys(firstItem).filter(k => k.startsWith('Slide'));
					
					if (slideKeys.length > 0) {
						// Extract slides from the object properties
						slides = slideKeys.map(key => {
							const slideData = firstItem[key];
							return {
								title: key,
								headline: slideData.Headline || slideData.headline || key,
								keyPoints: slideData['Key Points'] || slideData.keyPoints || [],
								supportingData: slideData['Supporting Data'] || slideData.supportingData || '',
								visualSuggestion: slideData['Visual Suggestions'] || slideData['Visual Suggestion'] || slideData.visualSuggestion || '',
								...slideData
							};
						});
					} else {
						// Regular array of slides
						slides = parsed.map((item, idx) => ({
							title: item.title || item.Title || `Slide ${idx + 1}`,
							headline: item.headline || item.Headline || '',
							keyPoints: item.key_points || item['Key Points'] || item.keyPoints || [],
							supportingData: item.supporting_data || item['Supporting Data'] || item.supportingData || '',
							visualSuggestion: item.visual_suggestions || item['Visual Suggestions'] || item.visualSuggestion || '',
							...item
						}));
					}
				}
			} else if (typeof parsed === 'object') {
				// Direct object with slide properties
				const slideKeys = Object.keys(parsed).filter(k => k.startsWith('Slide'));
				
				if (slideKeys.length > 0) {
					slides = slideKeys.map(key => {
						const slideData = parsed[key];
						return {
							title: key,
							headline: slideData.Headline || slideData.headline || key,
							keyPoints: slideData['Key Points'] || slideData.keyPoints || [],
							supportingData: slideData['Supporting Data'] || slideData.supportingData || '',
							visualSuggestion: slideData['Visual Suggestions'] || slideData['Visual Suggestion'] || slideData.visualSuggestion || '',
							...slideData
						};
					});
				}
			}
			
			console.log(`✅ Extracted ${slides.length} slides from parsed JSON`);
			
			// Normalize slides
			pitchDeck = {
				slides: slides.map((slide, idx) => ({
					title: slide.title || slide.Title || `Slide ${idx + 1}`,
					headline: slide.headline || slide.Headline || '',
					keyPoints: Array.isArray(slide['Key Points']) ? slide['Key Points'] : 
							   Array.isArray(slide.keyPoints) ? slide.keyPoints : [],
					content: slide.content || slide.Content || '',
					supportingData: slide['Supporting Data'] || slide.supportingData || '',
					visualSuggestion: slide['Visual Suggestions'] || slide.visualSuggestion || '',
					type: slide.type || slide.Type || 'default',
				}))
			};
		} catch (parseError) {
			console.error('❌ Pitch deck parse error:', parseError.message);
			pitchDeck = {
				rawContent: aiResponse,
				parseError: true,
			};
		}

		res.json({
			success: true,
			pitchDeck,
			context: ragContext.relevantDocs,
			timestamp: new Date(),
		});
	} catch (error) {
		console.error('Pitch Deck Generation Error:', error);
		const message = (error?.message || '').toLowerCase();
		if (
			message.includes('quota') ||
			message.includes('insufficient') ||
			message.includes('embedding') ||
			message.includes('openai') ||
			message.includes('watson') ||
			message.includes('404') ||
			message.includes('failed to generate')
		) {
			return res.status(200).json({
				success: true,
				pitchDeck: {
					slides: [
						{ slide: 1, title: 'Cover Slide', headline: req.body.ideaTitle || 'Your Startup', content: 'Company name, tagline, and positioning statement' },
						{ slide: 2, title: 'Problem', headline: 'Problem Statement', content: req.body.ideaDescription || 'The problem you are solving' },
						{ slide: 3, title: 'Solution', headline: 'Our Solution', content: 'Your unique solution and competitive advantage' },
						{ slide: 4, title: 'Market Opportunity', headline: 'Market Size', content: 'Total addressable market (TAM) analysis' },
						{ slide: 5, title: 'Business Model', headline: req.body.businessModel || 'Revenue Model', content: 'How you make money' },
						{ slide: 6, title: 'Competition', headline: 'Competitive Landscape', content: req.body.competitiveAdvantage || 'Competitive advantage' },
						{ slide: 7, title: 'Go-to-Market', headline: 'Customer Acquisition', content: 'How you will acquire customers' },
						{ slide: 8, title: 'Financial Projections', headline: '3-Year Forecast', content: 'Revenue projections and unit economics' },
						{ slide: 9, title: 'Team', headline: 'Team & Advisors', content: 'Key team members and their experience' },
						{ slide: 10, title: 'Ask', headline: req.body.fundingGoal || 'Funding Request', content: 'Funding amount and use of funds' },
					],
				},
				context: [],
				fallback: true,
				warning: 'AI service unavailable; showing pitch deck template. Customize with your specific details.',
			});
		}
		res.status(500).json({
			success: false,
			error: 'Failed to generate pitch deck',
			message: error.message,
		});
	}
});

/**
 * POST /api/ai/enhance-idea
 * Enhance an existing idea with AI suggestions
 */
router.post('/enhance-idea', auth, async (req, res) => {
	try {
		const { idea, focusArea } = req.body;

		// Skip RAG if embeddings are disabled (quota issues)
		const ragContext = process.env.RAG_SKIP_SEED === 'true'
			? { context: '', relevantDocs: [] }
			: await ragQuery(`enhance business idea: ${idea.title}`);

		const prompt = `Analyze and enhance the following business idea:

${JSON.stringify(idea, null, 2)}

Focus Area: ${focusArea || 'General improvement'}

Context:
${ragContext.context}

Provide:
1. Strengths of the current idea
2. Potential weaknesses or gaps
3. 5 specific improvement suggestions
4. Market opportunity analysis
5. Recommended next steps

Format as a structured JSON object.`;

		const aiResponse = await generateCompletion(prompt, {
			temperature: 0.7,
			max_tokens: 2000,
		});

		let enhancement;
		try {
			const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
			enhancement = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
		} catch (parseError) {
			enhancement = { rawContent: aiResponse };
		}

		res.json({
			success: true,
			enhancement,
			context: ragContext.relevantDocs,
		});
	} catch (error) {
		console.error('Idea Enhancement Error:', error);
		const message = (error?.message || '').toLowerCase();
		if (
			message.includes('quota') ||
			message.includes('insufficient') ||
			message.includes('embedding') ||
			message.includes('openai') ||
			message.includes('failed to generate')
		) {
			return res.status(200).json({
				success: true,
				enhancement: {
					strengths: ['Clear concept', 'Defined market'],
					weaknesses: ['Needs validation', 'Competitive landscape unclear'],
					suggestions: [
						'Conduct market research',
						'Define MVP features',
						'Identify key competitors',
						'Create financial projections',
						'Build prototype',
					],
				},
				context: [],
				fallback: true,
				warning: 'OpenAI unavailable; showing generic enhancement suggestions.',
			});
		}
		res.status(500).json({
			success: false,
			error: 'Failed to enhance idea',
			message: error.message,
		});
	}
});

export default router;
