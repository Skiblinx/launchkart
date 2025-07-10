import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { apiRequest } from '../App';
import {
  TrendingUp, Upload, FileText, DollarSign, Users, Calendar,
  CheckCircle, AlertCircle, Clock, Eye, Download, Star,
  Building, BarChart3, PieChart, Target, Award, Globe,
  ArrowRight, ChevronDown, Filter, Search, X
} from 'lucide-react';

const InvestmentSyndicate = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('apply');
  const [applications, setApplications] = useState([]);
  const [pitches, setPitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [selectedPitch, setSelectedPitch] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const mockApplications = [
    {
      id: 'app-1',
      company_name: 'TechFlow',
      industry: 'SaaS',
      funding_amount: 2000000,
      equity_offering: 12,
      stage: 'Seed',
      review_status: 'under_review',
      created_at: '2024-01-10',
      team_info: { team_size: 8 }
    }
  ];

  const mockPitches = [
    {
      id: 'pitch-1',
      company_name: 'FinFlow',
      industry: 'FinTech',
      funding_amount: 5000000,
      equity_offering: 15,
      stage: 'Series A',
      user: {
        fullName: 'Rahul Kumar',
        email: 'rahul@finflow.com',
        country: 'India'
      },
      team_info: {
        team_size: 12,
        founders: 2,
        key_hires: ['CTO', 'VP Sales', 'VP Marketing']
      },
      business_metrics: {
        revenue: 1200000,
        growth_rate: 250,
        customers: 15000,
        market_size: '50B USD'
      },
      review_status: 'under_review',
      created_at: '2024-01-15',
      traction: 'Growing 20% MoM, partnership with 3 major banks',
      problem: 'SMEs struggle with cash flow management and quick access to working capital',
      solution: 'AI-powered invoice financing and cash flow forecasting platform',
      use_of_funds: 'Product development (40%), Sales & Marketing (35%), Team expansion (25%)',
      competitive_advantage: 'Proprietary AI algorithms, exclusive banking partnerships, regulatory compliance expertise'
    },
    {
      id: 'pitch-2',
      company_name: 'HealthAI',
      industry: 'HealthTech',
      funding_amount: 3000000,
      equity_offering: 12,
      stage: 'Seed',
      user: {
        fullName: 'Dr. Sarah Ahmed',
        email: 'sarah@healthai.com',
        country: 'UAE'
      },
      team_info: {
        team_size: 8,
        founders: 2,
        key_hires: ['Chief Medical Officer', 'Head of Engineering']
      },
      business_metrics: {
        revenue: 450000,
        growth_rate: 180,
        customers: 5000,
        market_size: '25B USD'
      },
      review_status: 'approved',
      created_at: '2024-01-20',
      traction: 'Deployed in 15 hospitals, FDA approval in progress',
      problem: 'Medical diagnosis delays leading to poor patient outcomes',
      solution: 'AI-powered diagnostic assistant for early disease detection',
      use_of_funds: 'Clinical trials (50%), Regulatory approvals (30%), Market expansion (20%)',
      competitive_advantage: 'Breakthrough AI accuracy, medical team expertise, hospital partnerships'
    },
    {
      id: 'pitch-3',
      company_name: 'EcoLogistics',
      industry: 'Logistics',
      funding_amount: 8000000,
      equity_offering: 18,
      stage: 'Series A',
      user: {
        fullName: 'Priya Mehta',
        email: 'priya@ecologistics.com',
        country: 'India'
      },
      team_info: {
        team_size: 25,
        founders: 3,
        key_hires: ['COO', 'VP Technology', 'VP Business Development']
      },
      business_metrics: {
        revenue: 2800000,
        growth_rate: 300,
        customers: 500,
        market_size: '80B USD'
      },
      review_status: 'funded',
      created_at: '2024-01-10',
      traction: 'Operating in 4 cities, partnership with major e-commerce players',
      problem: 'Last-mile delivery is expensive and environmentally harmful',
      solution: 'Electric vehicle fleet with AI-optimized routing for sustainable logistics',
      use_of_funds: 'Fleet expansion (60%), Technology development (25%), Market expansion (15%)',
      competitive_advantage: 'First-mover advantage, sustainable tech, strong unit economics'
    }
  ];

  useEffect(() => {
    fetchApplications();
    if (user.role === 'investor' || user.role === 'admin') {
      fetchAllPitches();
    }
  }, [user.role]);

  const fetchApplications = async () => {
    try {
      // Use mock data for now
      setApplications(mockApplications);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPitches = async () => {
    try {
      setPitches(mockPitches);
    } catch (error) {
      console.error('Failed to fetch pitches:', error);
    }
  };

  const filteredPitches = pitches.filter(pitch => {
    const matchesSearch = pitch.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pitch.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pitch.user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || pitch.review_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const PitchApplicationForm = () => {
    const [formData, setFormData] = useState({
      company_name: '',
      industry: '',
      funding_amount: '',
      equity_offering: '',
      stage: '',
      problem: '',
      solution: '',
      traction: '',
      market_size: '',
      business_model: '',
      team_size: '',
      founders_count: '',
      revenue: '',
      growth_rate: '',
      customers: '',
      use_of_funds: '',
      competitive_advantage: '',
      pitch_deck: null,
      financial_projections: null,
      business_plan: null
    });
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const industries = [
      'FinTech', 'HealthTech', 'EdTech', 'E-commerce', 'SaaS', 'Logistics',
      'AI/ML', 'Blockchain', 'IoT', 'CleanTech', 'AgriTech', 'FoodTech', 'Other'
    ];

    const stages = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+'];

    const validateForm = () => {
      const newErrors = {};

      if (!formData.company_name.trim()) newErrors.company_name = 'Company name is required';
      if (!formData.industry) newErrors.industry = 'Industry is required';
      if (!formData.funding_amount || formData.funding_amount < 100000) {
        newErrors.funding_amount = 'Minimum funding amount is ₹1,00,000';
      }
      if (!formData.equity_offering || formData.equity_offering < 1 || formData.equity_offering > 50) {
        newErrors.equity_offering = 'Equity offering must be between 1% and 50%';
      }
      if (!formData.problem.trim()) newErrors.problem = 'Problem statement is required';
      if (!formData.solution.trim()) newErrors.solution = 'Solution description is required';
      if (!formData.pitch_deck) newErrors.pitch_deck = 'Pitch deck is required';

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!validateForm()) return;

      setSubmitting(true);
      try {
        const submitData = new FormData();

        Object.keys(formData).forEach(key => {
          if (formData[key] !== null && formData[key] !== '') {
            if (key === 'pitch_deck' || key === 'financial_projections' || key === 'business_plan') {
              if (formData[key]) submitData.append(key, formData[key]);
            } else {
              submitData.append(key, formData[key]);
            }
          }
        });

        const teamInfo = {
          team_size: parseInt(formData.team_size) || 0,
          founders: parseInt(formData.founders_count) || 0,
          key_hires: []
        };
        submitData.append('team_info', JSON.stringify(teamInfo));

        await apiRequest('post', '/investment/pitch', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        alert('Pitch application submitted successfully! We will review it within 5-7 business days.');
        setFormData({
          company_name: '',
          industry: '',
          funding_amount: '',
          equity_offering: '',
          stage: '',
          problem: '',
          solution: '',
          traction: '',
          market_size: '',
          business_model: '',
          team_size: '',
          founders_count: '',
          revenue: '',
          growth_rate: '',
          customers: '',
          use_of_funds: '',
          competitive_advantage: '',
          pitch_deck: null,
          financial_projections: null,
          business_plan: null
        });
        fetchApplications();
      } catch (error) {
        console.error('Failed to submit pitch:', error);
        alert('Failed to submit pitch application. Please try again.');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
            <h2 className="text-3xl font-bold mb-2">Investment Application</h2>
            <p className="text-blue-100">
              Submit your startup for review by our investment syndicate.
              Please provide detailed information about your company and growth plans.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-10">
            {/* Company Information */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Company Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.company_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Enter your company name"
                  />
                  {errors.company_name && <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry *
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.industry ? 'border-red-500' : 'border-gray-300'
                      }`}
                  >
                    <option value="">Select industry</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                  {errors.industry && <p className="text-red-500 text-sm mt-1">{errors.industry}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Funding Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.funding_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, funding_amount: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.funding_amount ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="e.g., 5000000"
                    min="100000"
                  />
                  {errors.funding_amount && <p className="text-red-500 text-sm mt-1">{errors.funding_amount}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equity Offering (%) *
                  </label>
                  <input
                    type="number"
                    value={formData.equity_offering}
                    onChange={(e) => setFormData(prev => ({ ...prev, equity_offering: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.equity_offering ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="e.g., 15"
                    min="1"
                    max="50"
                    step="0.1"
                  />
                  {errors.equity_offering && <p className="text-red-500 text-sm mt-1">{errors.equity_offering}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Funding Stage
                  </label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData(prev => ({ ...prev, stage: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="">Select stage</option>
                    {stages.map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Market Size
                  </label>
                  <input
                    type="text"
                    value={formData.market_size}
                    onChange={(e) => setFormData(prev => ({ ...prev, market_size: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="e.g., 50B USD"
                  />
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Business Details</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Problem Statement *
                </label>
                <textarea
                  value={formData.problem}
                  onChange={(e) => setFormData(prev => ({ ...prev, problem: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.problem ? 'border-red-500' : 'border-gray-300'
                    }`}
                  rows="4"
                  placeholder="What specific problem does your startup solve? Who faces this problem and how significant is it?"
                />
                {errors.problem && <p className="text-red-500 text-sm mt-1">{errors.problem}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Solution *
                </label>
                <textarea
                  value={formData.solution}
                  onChange={(e) => setFormData(prev => ({ ...prev, solution: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.solution ? 'border-red-500' : 'border-gray-300'
                    }`}
                  rows="4"
                  placeholder="How does your product/service solve this problem? What makes your approach unique?"
                />
                {errors.solution && <p className="text-red-500 text-sm mt-1">{errors.solution}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Traction & Achievements
                  </label>
                  <textarea
                    value={formData.traction}
                    onChange={(e) => setFormData(prev => ({ ...prev, traction: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    rows="4"
                    placeholder="Key milestones, partnerships, customer growth, revenue milestones, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Model
                  </label>
                  <textarea
                    value={formData.business_model}
                    onChange={(e) => setFormData(prev => ({ ...prev, business_model: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    rows="4"
                    placeholder="How do you make money? Revenue streams, pricing model, unit economics, etc."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Competitive Advantage
                </label>
                <textarea
                  value={formData.competitive_advantage}
                  onChange={(e) => setFormData(prev => ({ ...prev, competitive_advantage: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  rows="3"
                  placeholder="What makes you different from competitors? IP, technology, partnerships, network effects, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Use of Funds
                </label>
                <textarea
                  value={formData.use_of_funds}
                  onChange={(e) => setFormData(prev => ({ ...prev, use_of_funds: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  rows="4"
                  placeholder="How will you use the investment? Break down by percentage: Product development, marketing, hiring, operations, etc."
                />
              </div>
            </div>

            {/* Team & Metrics */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Team & Metrics</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Size
                  </label>
                  <input
                    type="number"
                    value={formData.team_size}
                    onChange={(e) => setFormData(prev => ({ ...prev, team_size: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Total employees"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Founders
                  </label>
                  <input
                    type="number"
                    value={formData.founders_count}
                    onChange={(e) => setFormData(prev => ({ ...prev, founders_count: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Co-founders"
                    min="1"
                    max="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Revenue (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.revenue}
                    onChange={(e) => setFormData(prev => ({ ...prev, revenue: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Current ARR"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Growth Rate (% YoY)
                  </label>
                  <input
                    type="number"
                    value={formData.growth_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, growth_rate: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Year-over-year growth"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Count
                  </label>
                  <input
                    type="number"
                    value={formData.customers}
                    onChange={(e) => setFormData(prev => ({ ...prev, customers: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Total customers"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Document Uploads */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Required Documents</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pitch Deck * (PDF, max 10MB)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={(e) => setFormData(prev => ({ ...prev, pitch_deck: e.target.files[0] }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.pitch_deck ? 'border-red-500' : 'border-gray-300'
                        }`}
                      accept=".pdf"
                    />
                  </div>
                  {errors.pitch_deck && <p className="text-red-500 text-sm mt-1">{errors.pitch_deck}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Financial Projections (Excel/PDF, optional)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setFormData(prev => ({ ...prev, financial_projections: e.target.files[0] }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    accept=".pdf,.xlsx,.xls"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Plan (PDF, optional)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setFormData(prev => ({ ...prev, business_plan: e.target.files[0] }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    accept=".pdf"
                  />
                </div>
              </div>
            </div>

            {/* Review Process Info */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 text-blue-600 mr-2" />
                Review Process Timeline
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Initial Review</p>
                    <p className="text-xs text-gray-600">5-7 business days</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Due Diligence</p>
                    <p className="text-xs text-gray-600">For approved applications</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Pitch Presentation</p>
                    <p className="text-xs text-gray-600">To syndicate members</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-semibold text-sm">4</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Funding Decision</p>
                    <p className="text-xs text-gray-600">Within 30 days</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Save Draft
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 font-medium transition-all duration-300 flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ApplicationsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Applications</h2>
        <button
          onClick={() => setActiveTab('apply')}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium transition-all duration-300 flex items-center"
        >
          <TrendingUp className="w-5 h-5 mr-2" />
          Submit New Application
        </button>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No applications submitted yet</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Ready to take your startup to the next level? Submit your first investment application and connect with our network of investors.
          </p>
          <button
            onClick={() => setActiveTab('apply')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium transition-all duration-300 flex items-center mx-auto"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            Submit Your First Application
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {applications.map((app) => (
            <div key={app.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {app.company_name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{app.company_name}</h3>
                      <p className="text-sm text-gray-500">
                        Submitted on {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${app.review_status === 'approved' ? 'bg-green-100 text-green-800' :
                      app.review_status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                        app.review_status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                      {app.review_status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      ₹{app.funding_amount?.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Industry</p>
                    <p className="font-semibold">{app.industry}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Equity</p>
                    <p className="font-semibold">{app.equity_offering}%</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Stage</p>
                    <p className="font-semibold">{app.stage || 'Not specified'}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Team</p>
                    <p className="font-semibold">{app.team_info?.team_size || 'Not specified'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {app.review_status === 'under_review' && 'Your application is being reviewed by our investment team.'}
                    {app.review_status === 'approved' && 'Congratulations! Your application has been approved for due diligence.'}
                    {app.review_status === 'rejected' && 'Thank you for your submission. Unfortunately, we cannot proceed at this time.'}
                  </div>
                  <div className="flex space-x-3">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
                      View Details
                    </button>
                    {app.review_status === 'approved' && (
                      <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium transition-colors">
                        Schedule Pitch
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const InvestorDashboard = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Investment Dashboard</h2>
        <div className="flex space-x-3">
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Investment Settings
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search companies, founders, or industries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="funded">Funded</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Applications</p>
              <p className="text-3xl font-bold text-gray-900">{pitches.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Under Review</p>
              <p className="text-3xl font-bold text-yellow-600">
                {pitches.filter(p => p.review_status === 'under_review').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-3xl font-bold text-green-600">
                {pitches.filter(p => p.review_status === 'approved').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Funded</p>
              <p className="text-3xl font-bold text-purple-600">
                {pitches.filter(p => p.review_status === 'funded').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Pitches Grid */}
      <div className="grid gap-6">
        {filteredPitches.map((pitch) => (
          <div key={pitch.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {pitch.company_name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{pitch.company_name}</h3>
                    <p className="text-gray-600 mb-1">{pitch.industry} • {pitch.stage}</p>
                    <p className="text-sm text-gray-500">
                      by {pitch.user.fullName} • {pitch.user.country}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${pitch.review_status === 'funded' ? 'bg-purple-100 text-purple-800' :
                    pitch.review_status === 'approved' ? 'bg-green-100 text-green-800' :
                      pitch.review_status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                    {pitch.review_status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border">
                  <p className="text-2xl font-bold text-green-600">
                    ₹{(pitch.funding_amount / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-sm text-gray-600">Funding Ask</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border">
                  <p className="text-2xl font-bold text-blue-600">{pitch.equity_offering}%</p>
                  <p className="text-sm text-gray-600">Equity</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border">
                  <p className="text-2xl font-bold text-purple-600">
                    ₹{(pitch.business_metrics.revenue / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-sm text-gray-600">Revenue</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border">
                  <p className="text-2xl font-bold text-orange-600">{pitch.business_metrics.growth_rate}%</p>
                  <p className="text-sm text-gray-600">Growth</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Target className="w-4 h-4 mr-2 text-red-500" />
                    Problem
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{pitch.problem}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Solution
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{pitch.solution}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-blue-500" />
                    Traction
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{pitch.traction}</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {pitch.team_info.team_size} team
                  </span>
                  <span className="flex items-center">
                    <Globe className="w-4 h-4 mr-1" />
                    {pitch.business_metrics.market_size} market
                  </span>
                  <span className="flex items-center">
                    <Target className="w-4 h-4 mr-1" />
                    {pitch.business_metrics.customers?.toLocaleString()} customers
                  </span>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setSelectedPitch(pitch)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </button>
                  {pitch.review_status === 'under_review' && (
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium transition-colors">
                      Approve
                    </button>
                  )}
                  {pitch.review_status === 'approved' && (
                    <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm font-medium transition-colors">
                      Invest Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPitches.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pitches found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Investment Syndicate</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          {user.role === 'founder'
            ? 'Get your startup funded by our network of angel investors and VCs. Submit your pitch and connect with the right investors for your growth stage.'
            : 'Discover and invest in promising early-stage startups. Access curated deal flow and connect with innovative entrepreneurs.'
          }
        </p>
      </div>

      {/* Navigation Tabs */}
      {user.role === 'founder' ? (
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('apply')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${activeTab === 'apply'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Apply for Funding
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${activeTab === 'applications'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            My Applications ({applications.length})
          </button>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="bg-gray-100 rounded-lg p-1">
            <button className="bg-white text-blue-600 shadow-sm py-3 px-6 text-sm font-medium rounded-md">
              Investment Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {user.role === 'founder' && activeTab === 'apply' && <PitchApplicationForm />}
      {user.role === 'founder' && activeTab === 'applications' && <ApplicationsTab />}
      {(user.role === 'investor' || user.role === 'admin') && <InvestorDashboard />}

      {/* Pitch Detail Modal */}
      {selectedPitch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{selectedPitch.company_name}</h2>
                <button
                  onClick={() => setSelectedPitch(null)}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Company Overview</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Industry:</span>
                        <span className="ml-2 font-medium">{selectedPitch.industry}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Stage:</span>
                        <span className="ml-2 font-medium">{selectedPitch.stage}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Team Size:</span>
                        <span className="ml-2 font-medium">{selectedPitch.team_info.team_size}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Market Size:</span>
                        <span className="ml-2 font-medium">{selectedPitch.business_metrics.market_size}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Problem & Solution</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Problem</h4>
                        <p className="text-gray-600">{selectedPitch.problem}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Solution</h4>
                        <p className="text-gray-600">{selectedPitch.solution}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Business Details</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Traction</h4>
                        <p className="text-gray-600">{selectedPitch.traction}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Use of Funds</h4>
                        <p className="text-gray-600">{selectedPitch.use_of_funds}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Competitive Advantage</h4>
                        <p className="text-gray-600">{selectedPitch.competitive_advantage}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Investment Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Funding Ask:</span>
                        <span className="font-semibold">₹{(selectedPitch.funding_amount / 1000000).toFixed(1)}M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Equity Offered:</span>
                        <span className="font-semibold">{selectedPitch.equity_offering}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valuation:</span>
                        <span className="font-semibold">
                          ₹{((selectedPitch.funding_amount / selectedPitch.equity_offering) * 100 / 1000000).toFixed(1)}M
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Revenue:</span>
                        <span className="font-semibold">₹{(selectedPitch.business_metrics.revenue / 1000000).toFixed(1)}M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Growth Rate:</span>
                        <span className="font-semibold">{selectedPitch.business_metrics.growth_rate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Customers:</span>
                        <span className="font-semibold">{selectedPitch.business_metrics.customers?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(user.role === 'investor' || user.role === 'admin') && (
                      <>
                        <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-medium transition-colors">
                          Schedule Meeting
                        </button>
                        <button className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 font-medium transition-colors">
                          Express Interest
                        </button>
                        <button className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                          Download Pitch Deck
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentSyndicate;