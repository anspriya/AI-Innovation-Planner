import React, { useState, useEffect } from 'react';
import { TrendingUp, Lightbulb, Save, Download, Star, Sparkles, Map, Presentation } from 'lucide-react';
import { AIIdeaGenerator } from './components/AIIdeaGenerator';
import { RoadmapGenerator } from './components/RoadmapGenerator';
import { PitchDeckGenerator } from './components/PitchDeckGenerator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';

const API = 'http://localhost:5000/api';

const SmartIdeaFinder = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [user, setUser] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [savedIdeas, setSavedIdeas] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [trendData, setTrendData] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [formData, setFormData] = useState({ domain: 'Tech', region: 'Global', keywords: '' });

  // Check authentication on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (err) {
          console.error('Error parsing stored user:', err);
          localStorage.removeItem('user');
        }
      }
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('landing');
    }
  }, []);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setCurrentPage('landing');
  };

  // Login Component
  const LoginPage = () => {
    const [loginData, setLoginData] = useState({ email: '', password: '' });

    const handleLogin = async (e) => {
      e.preventDefault();
      try {
        const res = await fetch(`${API}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginData),
        });
        const data = await res.json();
        if (data.token) {
          setToken(data.token);
          localStorage.setItem('token', data.token);
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
          setCurrentPage('dashboard');
        } else {
          alert(data.error || 'Login failed');
        }
      } catch (err) {
        alert('Login error');
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-green-50 to-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm relative z-10 border border-green-100">
          <div className="text-center mb-1">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg mb-3">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">
            Smart Idea Finder
          </h2>
          <p className="text-center text-gray-500 text-xs mb-6">Sign in to your account to get started</p>
          
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="email"
              placeholder="Email address"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all text-sm"
            />
            <input
              type="password"
              placeholder="Password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all text-sm"
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300 text-sm"
            >
              Sign In
            </button>
          </form>
          <div className="mt-5 text-center border-t border-gray-200 pt-4">
            <p className="text-gray-600 text-xs mb-2">Don't have an account?</p>
            <button
              onClick={() => setCurrentPage('signup')}
              className="text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text font-semibold hover:underline text-sm"
            >
              Create one now
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Signup Component
  const SignupPage = () => {
    const [signupData, setSignupData] = useState({ name: '', email: '', password: '' });

    const handleSignup = async (e) => {
      e.preventDefault();
      try {
        const res = await fetch(`${API}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(signupData),
        });
        const data = await res.json();
        if (data.token) {
          setToken(data.token);
          localStorage.setItem('token', data.token);
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
          setCurrentPage('dashboard');
        } else {
          alert(data.error || 'Signup failed');
        }
      } catch (err) {
        alert('Signup error');
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-green-50 to-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000"></div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm relative z-10 border border-green-100">
          <div className="text-center mb-1">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg mb-3">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">
            Get Started
          </h2>
          <p className="text-center text-gray-500 text-xs mb-6">Create your account to start generating ideas</p>

          <form onSubmit={handleSignup} className="space-y-3">
            <input
              type="text"
              placeholder="Full name"
              value={signupData.name}
              onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all text-sm"
            />
            <input
              type="email"
              placeholder="Email address"
              value={signupData.email}
              onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all text-sm"
            />
            <input
              type="password"
              placeholder="Create password"
              value={signupData.password}
              onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all text-sm"
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300 text-sm"
            >
              Create Account
            </button>
          </form>
          <div className="mt-5 text-center border-t border-gray-200 pt-4">
            <p className="text-gray-600 text-xs mb-2">Already have an account?</p>
            <button
              onClick={() => setCurrentPage('login')}
              className="text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text font-semibold hover:underline text-sm"
            >
              Sign in instead
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Dashboard Component
  const Dashboard = React.memo(() => {
    const [activeTab, setActiveTab] = useState('ai-generate');
    const [trendLoading, setTrendLoading] = useState(false);
    const [trendError, setTrendError] = useState('');

    // Fetch Google Trends data
    const fetchTrends = async () => {
      setTrendLoading(true);
      setTrendError('');
      try {
        const res = await fetch(
          `${API}/trends?domain=${formData.domain}&region=${formData.region}&keywords=${formData.keywords}`
        );
        const data = await res.json();
        if (data.trends && (data.trends.top || data.trends.rising)) {
          setTrendData(data.trends);
        } else {
          setTrendError('No trends found');
        }
      } catch (err) {
        setTrendError('Failed to fetch trends');
      }
      setTrendLoading(false);
    };

    const handleGenerateIdeas = async () => {
      setIsGenerating(true);
      try {
        const res = await fetch(
          `${API}/trends?domain=${formData.domain}&region=${formData.region}&keywords=${formData.keywords}`
        );
        const data = await res.json();
        if (data.trends && (Array.isArray(data.trends.top) || Array.isArray(data.trends.rising))) {
          const ideas = [];

          function generateIdea(trendName, type) {
            if (!trendName) return null;
            const lower = trendName.toLowerCase();
            let existing = '';
            if (lower.includes('ai'))
              existing = 'Existing: OpenAI, Google Gemini, Claude, Blackbox';
            else if (lower.includes('image') || lower.includes('photo'))
              existing = 'Existing: Midjourney, DALL-E, Remaker AI, AI photo editors';
            else if (lower.includes('chat'))
              existing = 'Existing: ChatGPT, Google Bard, Grok AI';
            else if (lower.includes('video'))
              existing = 'Existing: RunwayML, AI video generators, Veo 3 AI';
            else if (lower.includes('tool') || lower.includes('app'))
              existing = 'Existing: Blackbox, AI tools, Google Studio AI';
            else existing = 'Existing: Related search tools/apps';

            if (lower.includes('ai')) {
              return {
                title: `AI-powered ${trendName.replace(/ai/i, '').trim() || 'solution'} with a twist`,
                description: `Create a platform for ${
                  trendName.replace(/ai/i, '').trim() || 'automating tasks'
                } that combines AI with blockchain for secure, transparent automation. (${type})\n${existing}`,
              };
            }
            if (lower.includes('image') || lower.includes('photo')) {
              return {
                title: `Smart ${trendName} Marketplace`,
                description: `Develop a decentralized marketplace for AI-generated ${trendName}, allowing creators to monetize and users to discover unique content. (${type})\n${existing}`,
              };
            }
            if (lower.includes('chat')) {
              return {
                title: `Conversational ${trendName} for Healthcare`,
                description: `Build a chatbot focused on mental health support, integrating with wearable devices for real-time feedback. (${type})\n${existing}`,
              };
            }
            if (lower.includes('video')) {
              return {
                title: 'AI Video Editor for Social Impact',
                description: `Launch a service that uses AI to create and edit videos for NGOs and social causes, with automated storytelling features. (${type})\n${existing}`,
              };
            }
            if (lower.includes('tool') || lower.includes('app')) {
              return {
                title: `Next-gen ${trendName} Collaboration Platform`,
                description: `Design a collaborative app for remote teams, integrating AI for workflow automation and smart suggestions. (${type})\n${existing}`,
              };
            }
            return {
              title: `Innovative Solution: ${trendName}`,
              description: `Brainstorm a new product or service inspired by the trend: ${trendName}. For uniqueness, combine it with AR/VR or IoT. (${type})\n${existing}`,
            };
          }

          if (Array.isArray(data.trends.top)) {
            data.trends.top.forEach((trend, idx) => {
              const idea = generateIdea(trend.name, 'Top');
              if (idea) {
                ideas.push({
                  ...idea,
                  score: trend.value,
                  domain: formData.domain,
                  saved: false,
                  id: `top-${idx}`,
                });
              }
            });
          }
          if (Array.isArray(data.trends.rising)) {
            data.trends.rising.forEach((trend, idx) => {
              const idea = generateIdea(trend.name, 'Rising');
              if (idea) {
                ideas.push({
                  ...idea,
                  score: trend.value === 'Breakout' ? 100 : 0,
                  domain: formData.domain,
                  saved: false,
                  id: `rising-${idx}`,
                });
              }
            });
          }
          setIdeas(ideas);
        } else {
          setIdeas([]);
        }
      } catch (err) {
        alert('Failed to fetch ideas from Google Trends');
      }
      setIsGenerating(false);
    };

    const handleSaveIdea = async (ideaId) => {
      const idea = ideas.find((i) => i.id === ideaId || i._id === ideaId);
      if (!idea) return;
      try {
        const res = await fetch(`${API}/ideas/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...idea, saved: !idea.saved }),
        });
        const saved = await res.json();
        setSavedIdeas((prev) => [...prev, saved]);
        setIdeas(
          ideas.map((i) =>
            i.id === ideaId || i._id === ideaId ? { ...i, saved: !i.saved } : i
          )
        );
      } catch (err) {
        alert('Failed to save idea');
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-green-50 to-white flex flex-col py-8 relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
        </div>

        <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
          {/* Header */}
          <div className="mb-8 bg-white rounded-2xl p-6 border border-green-100 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">Smart Idea Finder</h1>
                  <p className="text-green-600 text-sm">Transform your ideas into reality</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right bg-green-50 px-4 py-2 rounded-lg border border-green-100">
                  <p className="text-xs text-green-600 uppercase tracking-wider">Welcome Back</p>
                  <p className="text-gray-800 font-semibold text-sm">{user && (user.name || user.email) ? user.name || user.email : 'User'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-5 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 font-medium text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="backdrop-blur-xl bg-white rounded-2xl border border-green-100 overflow-hidden shadow-xl">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 p-1">
                <TabsTrigger value="ai-generate" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-md hover:bg-white/50 transition-all text-gray-600 font-medium">
                  <Sparkles className="w-4 h-4" />
                  AI Ideas
                </TabsTrigger>
                <TabsTrigger value="roadmap" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-md hover:bg-white/50 transition-all text-gray-600 font-medium">
                  <Map className="w-4 h-4" />
                  Roadmap
                </TabsTrigger>
                <TabsTrigger value="pitch-deck" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-md hover:bg-white/50 transition-all text-gray-600 font-medium">
                  <Presentation className="w-4 h-4" />
                  Pitch Deck
                </TabsTrigger>
                <TabsTrigger value="saved" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-md hover:bg-white/50 transition-all text-gray-600 font-medium">
                  <Star className="w-4 h-4" />
                  Saved
                </TabsTrigger>
              </TabsList>

            <TabsContent value="ai-generate" className="mt-6">
              <AIIdeaGenerator token={token} />
            </TabsContent>

            <TabsContent value="roadmap" className="mt-6">
              <RoadmapGenerator token={token} />
            </TabsContent>

            <TabsContent value="pitch-deck" className="mt-6">
              <PitchDeckGenerator token={token} />
            </TabsContent>

            <TabsContent value="saved" className="mt-6 p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
                    <Star className="w-6 h-6 text-green-600" /> Saved Ideas
                  </h3>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`${API}/export`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({ ideas: savedIdeas }),
                        });
                        const blob = await res.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'saved_ideas.pdf';
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        window.URL.revokeObjectURL(url);
                      } catch (err) {
                        alert('Failed to export PDF');
                      }
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center gap-2"
                    disabled={!savedIdeas || savedIdeas.length === 0}
                  >
                    <Download className="w-4 h-4" /> Export to PDF
                  </button>
                </div>
                {savedIdeas && savedIdeas.length > 0 ? (
                  <ul className="space-y-4">
                    {savedIdeas.map((idea, idx) => (
                      <li key={idea.id || idea._id || idx} className="bg-white rounded-xl p-5 border border-green-100 hover:border-green-200 shadow-sm hover:shadow-md transition-all">
                        <div className="font-bold text-green-700 text-xl mb-2">{idea.title}</div>
                        <div className="mt-2 text-gray-600 whitespace-pre-line text-sm">{idea.description}</div>
                        
                        {/* Display Pitch Deck Content */}
                        {idea.pitchDeck && idea.pitchDeck.slides && idea.pitchDeck.slides.length > 0 && (
                          <div className="mt-4 border-t border-green-100 pt-4">
                            <h4 className="font-semibold text-green-700 mb-3 text-sm">📊 Pitch Deck Content</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {idea.pitchDeck.slides.map((slide, sidx) => (
                                <div key={sidx} className="bg-green-50/50 p-3 rounded-lg text-xs border border-green-100">
                                  <div className="font-semibold text-green-700 text-sm">{slide.headline || slide.title}</div>
                                  {slide.keyPoints && slide.keyPoints.length > 0 && (
                                    <ul className="list-disc list-inside text-xs mt-1 text-gray-600">
                                      {slide.keyPoints.slice(0, 2).map((pt, i) => (
                                        <li key={i} className="truncate">{pt}</li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Display Roadmap Content */}
                        {idea.roadmap && (idea.roadmap.Phases || idea.roadmap.Milestones || idea.roadmap.phases || idea.roadmap.milestones) && (
                          <div className="mt-4 border-t border-green-100 pt-4">
                            <h4 className="font-semibold text-green-700 mb-3 text-sm">🗺️ Roadmap</h4>
                            {(idea.roadmap.Phases || idea.roadmap.phases) && (
                              <div>
                                <p className="text-xs font-semibold text-gray-600 mb-1">Phases:</p>
                                <div className="flex flex-wrap gap-1">
                                  {(idea.roadmap.Phases || idea.roadmap.phases || []).map((phase, pidx) => {
                                    const phaseName = typeof phase === 'string' ? phase : (phase.title || phase.name || phase.Phase || 'Phase');
                                    return (
                                      <span key={pidx} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                        {phaseName}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            {(idea.roadmap.Milestones || idea.roadmap.milestones) && (
                              <div className="mt-2">
                                <p className="text-xs font-semibold text-gray-600 mb-1">Milestones:</p>
                                <ul className="text-xs space-y-1">
                                  {(idea.roadmap.Milestones || idea.roadmap.milestones || []).slice(0, 3).map((ms, midx) => {
                                    const milestoneName = typeof ms === 'string' ? ms : (ms.name || ms.milestone || ms.title || 'Milestone');
                                    return (
                                      <li key={midx} className="text-gray-600">• {milestoneName}</li>
                                    );
                                  })}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Display Ideas Array */}
                        {idea.ideas && Array.isArray(idea.ideas) && idea.ideas.length > 0 && (
                          <div className="mt-4 border-t border-green-100 pt-4">
                            <h4 className="font-semibold text-green-700 mb-3 text-sm">💡 Generated Ideas</h4>
                            <ul className="text-xs space-y-2">
                              {idea.ideas.map((ai, aiidx) => (
                                <li key={aiidx} className="bg-green-50/50 p-2 rounded-lg border border-green-100">
                                  <span className="font-semibold text-green-700 text-sm">{ai.title}</span>
                                  {ai.score && <span className="text-gray-500"> • Score: {ai.score}</span>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="mt-4 pt-3 border-t border-green-100 text-xs text-gray-400 flex gap-4">
                          <span>Score: {idea.score}</span>
                          <span>•</span>
                          <span>Domain: {idea.domain}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-400">No saved ideas yet.</div>
                )}
              </div>
            </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  });

  // Fetch saved ideas on mount
  useEffect(() => {
    if (token) {
      fetch(`${API}/ideas/favorites`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setSavedIdeas(data));
    }
  }, [token]);

  // Main App Router
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'login':
        return <LoginPage />;
      case 'signup':
        return <SignupPage />;
      case 'dashboard':
        return <Dashboard />;
      default:
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white via-green-50 to-white relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000"></div>
            </div>

            <div className="relative z-10 text-center max-w-3xl px-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl mb-6 shadow-lg">
                <Lightbulb className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                Smart Idea Finder
              </h1>
              <p className="text-lg text-green-700 mb-8">
                Transform your ideas into reality with AI-powered insights, roadmaps, and pitch decks
              </p>
              
              <div className="flex gap-3 justify-center mb-12">
                <button
                  onClick={() => setCurrentPage('login')}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300 text-sm"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setCurrentPage('signup')}
                  className="px-6 py-2.5 bg-green-50 text-green-700 rounded-lg font-semibold border border-green-300 hover:bg-green-100 transition-all duration-300 text-sm"
                >
                  Get Started
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-12">
                <div className="backdrop-blur-xl bg-green-50 rounded-lg p-4 border border-green-200 hover:bg-green-100/50 transition-all duration-300">
                  <Sparkles className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <h3 className="text-gray-800 font-semibold mb-1 text-sm">AI Ideas</h3>
                  <p className="text-xs text-green-700">Generate innovative ideas with AI</p>
                </div>
                <div className="backdrop-blur-xl bg-green-50 rounded-lg p-4 border border-green-200 hover:bg-green-100/50 transition-all duration-300">
                  <Map className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                  <h3 className="text-gray-800 font-semibold mb-1 text-sm">Roadmaps</h3>
                  <p className="text-xs text-green-700">Create detailed project roadmaps</p>
                </div>
                <div className="backdrop-blur-xl bg-green-50 rounded-lg p-4 border border-green-200 hover:bg-green-100/50 transition-all duration-300">
                  <Presentation className="w-6 h-6 text-teal-600 mx-auto mb-2" />
                  <h3 className="text-gray-800 font-semibold mb-1 text-sm">Pitch Decks</h3>
                  <p className="text-xs text-green-700">Build compelling pitch presentations</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return <div className="font-sans">{renderCurrentPage()}</div>;
};

export default SmartIdeaFinder;
