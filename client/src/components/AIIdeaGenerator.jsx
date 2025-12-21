import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Lightbulb, Sparkles, TrendingUp, Target, Save } from 'lucide-react';

const API = 'http://localhost:5000/api';

export function AIIdeaGenerator({ token }) {
	const [formData, setFormData] = useState({
		domain: 'Technology',
		keywords: '',
		region: 'Global',
		constraints: '',
	});
	const [loading, setLoading] = useState(false);
	const [ideas, setIdeas] = useState([]);
	const [error, setError] = useState('');
	const [saving, setSaving] = useState({});

	const handleGenerate = async () => {
		if (!formData.keywords.trim()) {
			setError('Please enter some keywords');
			return;
		}

		setLoading(true);
		setError('');
		try {
			const res = await fetch(`${API}/ai/generate-idea`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(formData),
			});

			const data = await res.json();
			if (data.success) {
				setIdeas(data.ideas);
			} else {
				setError(data.error || 'Failed to generate ideas');
			}
		} catch (err) {
			setError('Network error. Please try again.');
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const handleSaveIdea = async (idea, idx) => {
		setSaving({ ...saving, [idx]: true });
		try {
			const baseTitle = idea.title || 'Untitled Idea';
			const payload = {
				title: baseTitle,
				description: idea.description || '',
				score: idea.score || 0,
				domain: formData.domain,
				ideas: [idea], // Save the full idea with all details
				saved: true,
				_mergeTitle: baseTitle, // Merge with existing idea if same title
			};
			console.log('Saving idea:', payload);
			
			const res = await fetch(`${API}/ideas/save`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(payload),
			});
			const data = await res.json();
			console.log('Save response:', data);
			
			if (data.success) {
				alert('Idea saved successfully!');
			} else {
				alert(`Failed to save idea: ${data.error}`);
			}
		} catch (err) {
			alert('Network error while saving: ' + err.message);
			console.error(err);
		} finally {
			setSaving({ ...saving, [idx]: false });
		}
	};

	return (
		<div className="space-y-6 p-6">
			<Card className="border border-green-100 shadow-sm">
				<CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-green-50">
					<CardTitle className="flex items-center gap-2 text-gray-800">
						<Sparkles className="h-5 w-5 text-green-600" />
						AI Idea Generator
					</CardTitle>
					<CardDescription>
						Generate innovative business ideas powered by AI and market trends
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium mb-2">Domain</label>
							<Input
								value={formData.domain}
								onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
								placeholder="e.g., Technology, Healthcare, Education"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-2">Region</label>
							<Input
								value={formData.region}
								onChange={(e) => setFormData({ ...formData, region: e.target.value })}
								placeholder="e.g., Global, North America, Asia"
							/>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium mb-2">
							Keywords <span className="text-red-500">*</span>
						</label>
						<Input
							value={formData.keywords}
							onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
							placeholder="e.g., AI, sustainability, remote work, fintech"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-2">
							Constraints / Requirements (Optional)
						</label>
						<Textarea
							value={formData.constraints}
							onChange={(e) => setFormData({ ...formData, constraints: e.target.value })}
							placeholder="Any specific requirements, budget constraints, or focus areas..."
							rows={3}
						/>
					</div>

					{error && <div className="text-red-600 text-sm">{error}</div>}

					<Button onClick={handleGenerate} disabled={loading} className="w-full">
						{loading ? (
							<>
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
								Generating Ideas...
							</>
						) : (
							<>
								<Lightbulb className="mr-2 h-4 w-4" />
								Generate Ideas
							</>
						)}
					</Button>
				</CardContent>
			</Card>

			{ideas.length > 0 && (
				<div className="space-y-4">
					<h3 className="text-xl font-bold text-gray-800">Generated Ideas</h3>
					{ideas.map((idea, idx) => (
						<Card key={idx} className="border border-green-100 hover:border-green-200 hover:shadow-md transition-all">
							<CardHeader className="bg-gradient-to-br from-green-50/50 to-white border-b border-green-50">
								<CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
									<Lightbulb className="h-5 w-5 text-green-600" />
									{idea.title}
								</CardTitle>
								{idea.innovationScore && (
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<TrendingUp className="h-4 w-4" />
										Innovation Score: {idea.innovationScore}/10
									</div>
								)}
							</CardHeader>
							<CardContent className="space-y-3">
								<p className="text-sm text-muted-foreground">{idea.description}</p>

								{idea.targetMarket && (
									<div>
										<h4 className="font-semibold text-sm flex items-center gap-2">
											<Target className="h-4 w-4" />
											Target Market
										</h4>
										<p className="text-sm text-muted-foreground">{idea.targetMarket}</p>
									</div>
								)}

								{idea.uniqueValueProposition && (
									<div>
										<h4 className="font-semibold text-sm">Unique Value Proposition</h4>
										<p className="text-sm text-muted-foreground">
											{idea.uniqueValueProposition}
										</p>
									</div>
								)}

								{idea.potentialChallenges && (
									<div>
										<h4 className="font-semibold text-sm">Potential Challenges</h4>
										<p className="text-sm text-muted-foreground">
											{idea.potentialChallenges}
										</p>
									</div>
								)}

								{idea.estimatedMarketSize && (
									<div className="text-sm">
										<span className="font-semibold">Market Size: </span>
										<span className="text-muted-foreground">{idea.estimatedMarketSize}</span>
									</div>
								)}

								<Button 
									onClick={() => handleSaveIdea(idea, idx)}
									disabled={saving[idx]}
									className="w-full mt-4 bg-green-600 hover:bg-green-700"
								>
									{saving[idx] ? 'Saving...' : <>
										<Save className="mr-2 h-4 w-4" />
										Save Idea
									</>}
								</Button>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
