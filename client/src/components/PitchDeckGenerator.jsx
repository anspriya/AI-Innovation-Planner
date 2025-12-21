import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Presentation, TrendingUp, DollarSign, Users, Save } from 'lucide-react';

const API = 'http://localhost:5000/api';

export function PitchDeckGenerator({ token }) {
	const [formData, setFormData] = useState({
		ideaTitle: '',
		ideaDescription: '',
		targetMarket: '',
		businessModel: '',
		competitiveAdvantage: '',
		fundingGoal: '$500K',
	});
	const [loading, setLoading] = useState(false);
	const [pitchDeck, setPitchDeck] = useState(null);
	const [error, setError] = useState('');
	const [saving, setSaving] = useState(false);

	const handleGenerate = async () => {
		if (!formData.ideaTitle.trim() || !formData.ideaDescription.trim()) {
			setError('Please fill in idea title and description');
			return;
		}

		setLoading(true);
		setError('');
		try {
			const res = await fetch(`${API}/ai/generate-pitch-deck`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(formData),
			});

			const data = await res.json();
			if (data.success) {
				setPitchDeck(data.pitchDeck);
			} else {
				setError(data.error || 'Failed to generate pitch deck');
			}
		} catch (err) {
			setError('Network error. Please try again.');
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const handleSavePitchDeck = async () => {
		setSaving(true);
		try {
			const baseTitle = formData.ideaTitle || 'Untitled Pitch Deck';
			const payload = {
				title: baseTitle,
				description: formData.ideaDescription || '',
				pitchDeck,
				targetMarket: formData.targetMarket,
				businessModel: formData.businessModel,
				competitiveAdvantage: formData.competitiveAdvantage,
				fundingGoal: formData.fundingGoal,
				saved: true,
				_mergeTitle: baseTitle,
			};
			console.log('Saving pitch deck:', payload);
			
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
				alert('Pitch Deck saved successfully!');
			} else {
				alert(`Failed to save pitch deck: ${data.error}`);
			}
		} catch (err) {
			alert('Network error while saving: ' + err.message);
			console.error(err);
		} finally {
			setSaving(false);
		}
	};

	const slideIcons = {
		problem: '❗',
		solution: '💡',
		market: '📊',
		product: '🚀',
		business: '💰',
		traction: '📈',
		competition: '⚔️',
		team: '👥',
		financial: '💵',
		ask: '🎯',
	};

	return (
		<div className="space-y-6 p-6">
			<Card className="border border-green-100 shadow-sm">
				<CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-green-50">
					<CardTitle className="flex items-center gap-2 text-gray-800">
						<Presentation className="h-5 w-5 text-green-600" />
						Pitch Deck Generator
					</CardTitle>
					<CardDescription>
						Create compelling pitch deck content for fundraising and presentations
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<label className="block text-sm font-medium mb-2">
							Idea Title <span className="text-red-500">*</span>
						</label>
						<Input
							value={formData.ideaTitle}
							onChange={(e) => setFormData({ ...formData, ideaTitle: e.target.value })}
							placeholder="e.g., EcoTrack - Carbon Footprint Tracker"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-2">
							Idea Description <span className="text-red-500">*</span>
						</label>
						<Textarea
							value={formData.ideaDescription}
							onChange={(e) => setFormData({ ...formData, ideaDescription: e.target.value })}
							placeholder="Describe your business idea..."
							rows={3}
						/>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium mb-2">Target Market</label>
							<Input
								value={formData.targetMarket}
								onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })}
								placeholder="e.g., Millennials interested in sustainability"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-2">Business Model</label>
							<Input
								value={formData.businessModel}
								onChange={(e) => setFormData({ ...formData, businessModel: e.target.value })}
								placeholder="e.g., Freemium SaaS"
							/>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium mb-2">Competitive Advantage</label>
						<Textarea
							value={formData.competitiveAdvantage}
							onChange={(e) =>
								setFormData({ ...formData, competitiveAdvantage: e.target.value })
							}
							placeholder="What makes your solution unique?"
							rows={2}
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-2">Funding Goal</label>
						<Input
							value={formData.fundingGoal}
							onChange={(e) => setFormData({ ...formData, fundingGoal: e.target.value })}
							placeholder="e.g., $500K seed round"
						/>
					</div>

					{error && <div className="text-red-600 text-sm">{error}</div>}

					<Button onClick={handleGenerate} disabled={loading} className="w-full">
						{loading ? (
							<>
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
								Generating Pitch Deck...
							</>
						) : (
							<>
								<Presentation className="mr-2 h-4 w-4" />
								Generate Pitch Deck
							</>
						)}
					</Button>
				</CardContent>
			</Card>

			{pitchDeck && (
				<div className="space-y-6">
					<div className="flex items-center justify-between">
						<h3 className="text-xl font-bold text-gray-800">Pitch Deck Content</h3>
						<p className="text-sm text-gray-500">
							{pitchDeck.slides?.length || 0} slides
						</p>
					</div>

					{pitchDeck.slides && pitchDeck.slides.length > 0 ? (
						<div className="grid grid-cols-1 gap-4">
							{pitchDeck.slides.map((slide, idx) => (
								<Card key={idx} className="border border-green-100 hover:border-green-200 hover:shadow-md transition-all">
									<CardHeader className="bg-gradient-to-br from-green-50/50 to-white border-b border-green-50">
										<div className="flex items-center gap-2">
											<span className="text-2xl">
												{slideIcons[slide.type] || slideIcons[slide.slideType] || '📄'}
											</span>
											<div className="flex-1">
												<CardTitle className="text-lg">
													Slide {idx + 1}: {slide.headline || slide.title || `Slide ${idx + 1}`}
												</CardTitle>
												{slide.subtitle && (
													<CardDescription>{slide.subtitle}</CardDescription>
												)}
											</div>
										</div>
									</CardHeader>
								<CardContent className="space-y-3">
									{slide.headline && slide.headline !== slide.title && (
										<h4 className="font-semibold">{slide.headline}</h4>
									)}

									{slide.keyPoints && Array.isArray(slide.keyPoints) && slide.keyPoints.length > 0 && (
										<div>
											<h5 className="font-semibold text-sm mb-2">Key Points:</h5>
											<ul className="list-disc list-inside space-y-1">
												{slide.keyPoints.map((point, i) => (
													<li key={i} className="text-sm text-muted-foreground">
														{typeof point === 'string' ? point : JSON.stringify(point)}
													</li>
												))}
											</ul>
										</div>
									)}

									{slide.content && (
										<div className="text-sm text-muted-foreground whitespace-pre-wrap">
											{typeof slide.content === 'string' ? slide.content : JSON.stringify(slide.content, null, 2)}
										</div>
									)}

									{slide.supportingData && (
										<div className="bg-muted p-3 rounded-lg">
											<h5 className="font-semibold text-sm mb-1 flex items-center gap-1">
												<TrendingUp className="h-4 w-4" />
												Supporting Data
											</h5>
											<p className="text-sm text-muted-foreground">{slide.supportingData}</p>
										</div>
									)}

									{slide.visualSuggestion && (
										<div className="text-xs text-muted-foreground italic">
											💡 Visual suggestion: {slide.visualSuggestion}
										</div>
									)}
								</CardContent>
							</Card>
						))}
					</div>
				) : pitchDeck.rawContent ? (
					<Card>
						<CardHeader>
							<CardTitle>Pitch Deck JSON</CardTitle>
						</CardHeader>
						<CardContent>
							<pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-xs whitespace-pre-wrap break-words">
								{typeof pitchDeck.rawContent === 'string' 
									? pitchDeck.rawContent 
									: JSON.stringify(pitchDeck.rawContent, null, 2)}
							</pre>
						</CardContent>
					</Card>
				) : (
					<Card>
						<CardContent className="pt-6">
							<p className="text-muted-foreground">No pitch deck content available.</p>
						</CardContent>
					</Card>
				)}

				<Button 
					onClick={handleSavePitchDeck}
					disabled={saving}
					className="w-full bg-green-600 hover:bg-green-700"
				>
					{saving ? 'Saving...' : <>
						<Save className="mr-2 h-4 w-4" />
						Save Pitch Deck
					</>}
				</Button>
			</div>
		)}
	</div>
	);
}

export default PitchDeckGenerator;
