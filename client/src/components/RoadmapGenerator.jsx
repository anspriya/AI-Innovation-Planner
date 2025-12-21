import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Map, Calendar, Users, AlertCircle, CheckCircle2, Save } from 'lucide-react';

const API = 'http://localhost:5000/api';

export function RoadmapGenerator({ token }) {
	const [formData, setFormData] = useState({
		ideaTitle: '',
		ideaDescription: '',
		timeline: '6 months',
		teamSize: 'Small (3-5 people)',
		budget: 'Bootstrapped',
	});
	const [loading, setLoading] = useState(false);
	const [roadmap, setRoadmap] = useState(null);
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
			const res = await fetch(`${API}/ai/generate-roadmap`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(formData),
			});

			const data = await res.json();
			if (data.success) {
				setRoadmap(data.roadmap);
			} else {
				setError(data.error || 'Failed to generate roadmap');
			}
		} catch (err) {
			setError('Network error. Please try again.');
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const handleSaveRoadmap = async () => {
		setSaving(true);
		try {
			const baseTitle = formData.ideaTitle || 'Untitled Roadmap';
			const payload = {
				title: baseTitle,
				description: formData.ideaDescription || '',
				roadmap,
				saved: true,
				_mergeTitle: baseTitle,
			};
			console.log('Saving roadmap:', payload);
			
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
				alert('Roadmap saved successfully!');
			} else {
				alert(`Failed to save roadmap: ${data.error}`);
			}
		} catch (err) {
			alert('Network error while saving: ' + err.message);
			console.error(err);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="space-y-6 p-6">
			<Card className="border border-green-100 shadow-sm">
				<CardHeader className="bg-gradient-to-r from-green-50 to-white border-b border-green-50">
					<CardTitle className="flex items-center gap-2 text-gray-800">
						<Map className="h-5 w-5 text-green-600" />
						Project Roadmap Generator
					</CardTitle>
					<CardDescription>
						Create a detailed project roadmap with phases, milestones, and resources
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
							placeholder="e.g., AI-Powered Task Manager"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-2">
							Idea Description <span className="text-red-500">*</span>
						</label>
						<Textarea
							value={formData.ideaDescription}
							onChange={(e) => setFormData({ ...formData, ideaDescription: e.target.value })}
							placeholder="Describe your idea in detail..."
							rows={4}
						/>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label className="block text-sm font-medium mb-2">Timeline</label>
							<Input
								value={formData.timeline}
								onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
								placeholder="e.g., 6 months"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-2">Team Size</label>
							<Input
								value={formData.teamSize}
								onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
								placeholder="e.g., 5 people"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-2">Budget</label>
							<Input
								value={formData.budget}
								onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
								placeholder="e.g., $50K"
							/>
						</div>
					</div>

					{error && <div className="text-red-600 text-sm">{error}</div>}

					<Button onClick={handleGenerate} disabled={loading} className="w-full">
						{loading ? (
							<>
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
								Generating Roadmap...
							</>
						) : (
							<>
								<Map className="mr-2 h-4 w-4" />
								Generate Roadmap
							</>
						)}
					</Button>
				</CardContent>
			</Card>

			{roadmap && (
				<div className="space-y-6">
					<h3 className="text-xl font-bold text-gray-800">Project Roadmap</h3>

					{/* Phases */}
					{roadmap.Phases && roadmap.Phases.length > 0 && (
						<div className="space-y-4">
							<h4 className="text-lg font-semibold text-gray-700">Phases</h4>
							{roadmap.Phases.map((phase, idx) => (
								<Card key={idx} className="border border-green-100 hover:border-green-200 hover:shadow-md transition-all">
									<CardHeader className="bg-gradient-to-br from-green-50/50 to-white border-b border-green-50">
										<CardTitle className="text-lg flex items-center gap-2 text-gray-800">
											<Calendar className="h-5 w-5 text-green-600" />
											Phase {idx + 1}: {phase.title || 'Phase'}
										</CardTitle>
										{phase.duration && (
											<CardDescription>Duration: {phase.duration}</CardDescription>
										)}
									</CardHeader>
									<CardContent className="space-y-3">
										{phase.objectives && phase.objectives.length > 0 && (
											<div>
												<h5 className="font-semibold text-sm mb-1">Objectives</h5>
												{Array.isArray(phase.objectives) ? (
													<ul className="list-disc list-inside text-sm text-muted-foreground">
														{phase.objectives.map((obj, i) => (
															<li key={i}>{typeof obj === 'string' ? obj : JSON.stringify(obj)}</li>
														))}
													</ul>
												) : (
													<p className="text-sm text-muted-foreground">{phase.objectives}</p>
												)}
											</div>
										)}

										{phase.deliverables && phase.deliverables.length > 0 && (
											<div>
												<h5 className="font-semibold text-sm mb-1 flex items-center gap-1">
													<CheckCircle2 className="h-4 w-4" />
													Deliverables
												</h5>
												{Array.isArray(phase.deliverables) ? (
													<ul className="list-disc list-inside text-sm text-muted-foreground">
														{phase.deliverables.map((del, i) => (
															<li key={i}>{typeof del === 'string' ? del : JSON.stringify(del)}</li>
														))}
													</ul>
												) : (
													<p className="text-sm text-muted-foreground">{phase.deliverables}</p>
												)}
											</div>
										)}

										{phase.risks && phase.risks.length > 0 && (
											<div>
												<h5 className="font-semibold text-sm mb-1 flex items-center gap-1">
													<AlertCircle className="h-4 w-4" />
													Risks
												</h5>
												{Array.isArray(phase.risks) ? (
													<ul className="list-disc list-inside text-sm text-muted-foreground">
														{phase.risks.map((risk, i) => (
															<li key={i}>{typeof risk === 'string' ? risk : JSON.stringify(risk)}</li>
														))}
													</ul>
												) : (
													<p className="text-sm text-muted-foreground">{phase.risks}</p>
												)}
											</div>
										)}
									</CardContent>
								</Card>
							))}
						</div>
					)}

					{/* Milestones */}
					{roadmap.Milestones && roadmap.Milestones.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle>Key Milestones</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									{roadmap.Milestones.map((milestone, idx) => (
										<div key={idx} className="flex items-start gap-2">
											<CheckCircle2 className="h-4 w-4 text-green-600 mt-1" />
											<div className="flex-1">
												<p className="text-sm font-medium">
													{milestone.name || milestone.milestone || 'Milestone'}
												</p>
												{milestone.targetDate && (
													<p className="text-xs text-muted-foreground">{milestone.targetDate}</p>
												)}
												{milestone.description && (
													<p className="text-xs text-muted-foreground">{milestone.description}</p>
												)}
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Raw content fallback */}
					{roadmap.rawContent && (
						<Card>
							<CardContent className="pt-6">
								<div className="prose prose-sm max-w-none whitespace-pre-wrap">
									{roadmap.rawContent}
								</div>
							</CardContent>
						</Card>
					)}

					<Button 
						onClick={handleSaveRoadmap}
						disabled={saving}
						className="w-full bg-green-600 hover:bg-green-700"
					>
						{saving ? 'Saving...' : <>
							<Save className="mr-2 h-4 w-4" />
							Save Roadmap
						</>}
					</Button>
				</div>
			)}
		</div>
	);
}
