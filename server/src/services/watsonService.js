import dotenv from 'dotenv';
dotenv.config();

// IBM Watson SDK for WatsonX.ai
import { IamAuthenticator } from 'ibm-cloud-sdk-core';

/**
 * Watson LLM Service
 * Provides text generation using IBM WatsonX.ai
 */

// Initialize Watson client
let watsonClient = null;

try {
	if (process.env.WATSON_API_KEY && process.env.WATSON_URL) {
		const authenticator = new IamAuthenticator({
			apikey: process.env.WATSON_API_KEY,
		});

		watsonClient = {
			authenticator,
			serviceUrl: process.env.WATSON_URL,
			projectId: process.env.WATSON_PROJECT_ID || '',
		};

		console.log('✅ Watson AI client initialized');
	} else {
		console.warn('⚠️  Watson credentials not found, AI features will use fallback');
	}
} catch (error) {
	console.error('Watson initialization error:', error.message);
}

/**
 * Generate text completion using Watson
 * @param {string} prompt - The prompt to generate completion for
 * @param {object} options - Generation options
 * @returns {Promise<string>} Generated text
 */
export async function generateCompletion(prompt, options = {}) {
	if (!watsonClient) {
		throw new Error('Watson client not initialized. Please check your credentials.');
	}

	try {
		const {
			temperature = 0.7,
			max_tokens = 2000,
			model = process.env.WATSON_MODEL || 'ibm/granite-13b-chat-v2',
		} = options;

		console.log('🔵 Watson API Call - Model:', model);
		console.log('🔵 Watson URL:', watsonClient.serviceUrl);
		console.log('🔵 Watson Project ID:', watsonClient.projectId);

		// Get authentication token
		const token = await watsonClient.authenticator.tokenManager.getToken();
		console.log('🔵 Watson Token acquired');

		// Make request to Watson API
		const apiUrl = `${watsonClient.serviceUrl}/ml/v1/text/generation?version=2024-11-13`;
		console.log('🔵 API URL:', apiUrl);
		
		const requestBody = {
			input: prompt,
			model_id: model,
			project_id: watsonClient.projectId,
			parameters: {
				temperature: temperature,
				max_new_tokens: max_tokens,
				min_new_tokens: 1,
				decoding_method: 'greedy',
			},
		};
		console.log('🔵 Request Body:', JSON.stringify(requestBody, null, 2));
		
		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			console.error('❌ Watson API Error Response:', errorData);
			throw new Error(`Watson API error: ${response.status} ${errorData.error || response.statusText}`);
		}

		const data = await response.json();
		console.log('✅ Watson Response:', JSON.stringify(data, null, 2));
		const generatedText = data.results?.[0]?.generated_text || '';

		return generatedText.trim();
	} catch (error) {
		console.error('Watson API Error:', error);
		throw new Error(`Failed to generate AI completion: ${error.message}`);
	}
}

/**
 * Generate embeddings using Watson (for RAG)
 * @param {string} text - Text to generate embeddings for
 * @returns {Promise<number[]>} Embedding vector
 */
export async function generateEmbedding(text) {
	if (!watsonClient) {
		throw new Error('Watson client not initialized. Please check your credentials.');
	}

	try {
		// Get authentication token
		const token = await watsonClient.authenticator.tokenManager.getToken();

		// Watson embedding model
		const embeddingModel = process.env.WATSON_EMBEDDING_MODEL || 'ibm/slate-125m-english-rtrvr';

		const response = await fetch(`${watsonClient.serviceUrl}/ml/v1/text/embeddings?version=2023-05-29`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
			body: JSON.stringify({
				inputs: [text],
				model_id: embeddingModel,
				project_id: watsonClient.projectId,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(`Watson embedding error: ${response.status} ${errorData.error || response.statusText}`);
		}

		const data = await response.json();
		const embedding = data.results?.[0]?.embedding || [];

		return embedding;
	} catch (error) {
		console.error('Watson Embedding Error:', error);
		throw new Error(`Failed to generate embedding: ${error.message}`);
	}
}

/**
 * Stream completion (optional - for future use)
 * Watson also supports streaming responses
 */
export async function streamCompletion(prompt, options = {}) {
	// For now, use regular completion
	// Watson streaming can be implemented later if needed
	return await generateCompletion(prompt, options);
}

export default {
	generateCompletion,
	generateEmbedding,
	streamCompletion,
};
