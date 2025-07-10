import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { apiRequest } from '../App';
import BusinessEssentials from './BusinessEssentials';
import {
  Building, Globe, Smartphone, FileText, TrendingUp, Award,
  Database, Upload, Download, Clock, CheckCircle, AlertCircle,
  DollarSign, Calendar, MessageSquare, Star, Filter, Search
} from 'lucide-react';

const ServicesMarketplace = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const serviceCategories = [
    { id: 'legal', name: 'Legal & Compliance', icon: FileText },
    { id: 'tech', name: 'Technology', icon: Smartphone },
    { id: 'marketing', name: 'Marketing & Branding', icon: TrendingUp },
    { id: 'business', name: 'Business Setup', icon: Building },
    { id: 'operations', name: 'Operations', icon: Database }
  ];

  const availableServices = [
    {
      id: 'incorporation-india',
      title: 'Company Incorporation - India',
      category: 'legal',
      description: 'Complete private limited company setup with ROC filing, PAN, TAN, and bank account assistance',
      price: 15000,
      duration: '7-10 days',
      features: ['ROC Registration', 'PAN & TAN Application', 'Bank Account Opening', 'Digital Signature', 'Compliance Calendar'],
      requirements: ['Director Details', 'Address Proof', 'Business Plan']
    },
    {
      id: 'incorporation-uae',
      title: 'Company Incorporation - UAE',
      category: 'legal',
      description: 'Free zone or mainland company setup with trade license and visa processing',
      price: 25000,
      duration: '10-15 days',
      features: ['Trade License', 'Visa Processing', 'Bank Account Setup', 'Office Space Assistance'],
      requirements: ['Passport Copies', 'No Objection Letter', 'Business Plan']
    },
    {
      id: 'website-basic',
      title: 'Business Website',
      category: 'tech',
      description: 'Professional 5-page website with CMS, mobile responsive design and SEO optimization',
      price: 35000,
      duration: '2-3 weeks',
      features: ['5 Pages', 'Mobile Responsive', 'CMS Integration', 'SEO Optimization', '3 Months Support'],
      requirements: ['Content & Images', 'Brand Guidelines', 'Domain Preferences']
    },
    {
      id: 'ecommerce',
      title: 'E-commerce Platform',
      category: 'tech',
      description: 'Full-featured online store with payment gateway, inventory management and analytics',
      price: 75000,
      duration: '4-6 weeks',
      features: ['Product Catalog', 'Payment Gateway', 'Inventory Management', 'Analytics Dashboard', 'Mobile App'],
      requirements: ['Product Information', 'Payment Details', 'Shipping Preferences']
    },
    {
      id: 'mobile-app',
      title: 'Mobile App Development',
      category: 'tech',
      description: 'Native iOS and Android app with backend API and admin dashboard',
      price: 150000,
      duration: '8-12 weeks',
      features: ['iOS & Android Apps', 'Backend API', 'Admin Dashboard', 'Push Notifications', '6 Months Support'],
      requirements: ['App Wireframes', 'Feature Specifications', 'Design Assets']
    },
    {
      id: 'legal-docs',
      title: 'Legal Document Package',
      category: 'legal',
      description: 'Essential business documents including MoU, NDA, Shareholder Agreement',
      price: 12000,
      duration: '3-5 days',
      features: ['MoU Template', 'NDA Template', 'Shareholder Agreement', 'Employee Contracts', 'Privacy Policy'],
      requirements: ['Business Details', 'Stakeholder Information', 'Specific Requirements']
    },
    {
      id: 'marketing-strategy',
      title: 'Marketing & SEO Strategy',
      category: 'marketing',
      description: 'Comprehensive marketing plan with SEO audit, content strategy and social media roadmap',
      price: 25000,
      duration: '1-2 weeks',
      features: ['SEO Audit', 'Content Strategy', 'Social Media Plan', 'Competitor Analysis', 'Growth Roadmap'],
      requirements: ['Current Marketing Materials', 'Target Audience Info', 'Competitor List']
    },
    {
      id: 'trademark',
      title: 'Trademark Registration',
      category: 'legal',
      description: 'Complete trademark search, filing and registration with ongoing protection',
      price: 18000,
      duration: '12-18 months',
      features: ['Trademark Search', 'Filing & Registration', 'Response to Objections', 'Certificate Delivery'],
      requirements: ['Logo/Brand Name', 'Business Category', 'Usage Evidence']
    },
    {
      id: 'crm-setup',
      title: 'CRM/ERP Implementation',
      category: 'operations',
      description: 'Complete CRM/ERP system setup with training and customization',
      price: 45000,
      duration: '3-4 weeks',
      features: ['System Setup', 'Data Migration', 'Custom Workflows', 'Team Training', 'Integration Support'],
      requirements: ['Current System Data', 'Process Requirements', 'Team Size']
    }
  ];

  useEffect(() => {
    fetchServices();
    fetchServiceRequests();
  }, []);

  const fetchServices = async () => {
    try {
      setServices(availableServices);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  };

  const fetchServiceRequests = async () => {
    try {
      const response = await apiRequest('get', '/service-requests');
      setServiceRequests(response.data || []);
    } catch (error) {
      console.error('Failed to fetch service requests:', error);
      setServiceRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || service.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const ServiceCard = ({ service }) => (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              {React.createElement(
                serviceCategories.find(cat => cat.id === service.category)?.icon || Building,
                { className: "w-6 h-6 text-blue-600" }
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{service.title}</h3>
              <p className="text-sm text-gray-500 capitalize">{service.category}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">₹{service.price.toLocaleString()}</p>
            <p className="text-sm text-gray-500">{service.duration}</p>
          </div>
        </div>

        <p className="text-gray-600 mb-4 text-sm">{service.description}</p>

        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">What's Included:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {service.features.slice(0, 3).map((feature, index) => (
              <li key={index} className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                {feature}
              </li>
            ))}
            {service.features.length > 3 && (
              <li className="text-blue-600 text-xs">+{service.features.length - 3} more features</li>
            )}
          </ul>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => {
              setSelectedService(service);
              setShowQuoteModal(true);
            }}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Request Quote
          </button>
          <button
            onClick={() => setSelectedService(service)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );

  const QuoteRequestModal = () => {
    const [quoteForm, setQuoteForm] = useState({
      requirements: '',
      timeline: '',
      budget: '',
      additionalNotes: '',
      files: []
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);

      try {
        const formData = new FormData();
        formData.append('service_type', selectedService.id);
        formData.append('title', `${selectedService.title} - Quote Request`);
        formData.append('description', quoteForm.requirements);
        formData.append('budget', parseFloat(quoteForm.budget) || selectedService.price);
        formData.append('timeline', quoteForm.timeline);
        formData.append('additional_notes', quoteForm.additionalNotes);

        // Add files if any
        quoteForm.files.forEach(file => {
          formData.append('files', file);
        });

        await apiRequest('post', '/services/request', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        setShowQuoteModal(false);
        setSelectedService(null);
        setQuoteForm({
          requirements: '',
          timeline: '',
          budget: '',
          additionalNotes: '',
          files: []
        });

        // Refresh service requests
        fetchServiceRequests();
        alert('Quote request submitted successfully!');
      } catch (error) {
        console.error('Failed to submit quote request:', error);
        alert('Failed to submit quote request. Please try again.');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Request Quote: {selectedService?.title}</h2>
              <button
                onClick={() => setShowQuoteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Requirements *
              </label>
              <textarea
                value={quoteForm.requirements}
                onChange={(e) => setQuoteForm(prev => ({ ...prev, requirements: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
                placeholder="Describe your specific requirements..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Timeline
                </label>
                <select
                  value={quoteForm.timeline}
                  onChange={(e) => setQuoteForm(prev => ({ ...prev, timeline: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select timeline</option>
                  <option value="urgent">Urgent (ASAP)</option>
                  <option value="1-2weeks">1-2 weeks</option>
                  <option value="3-4weeks">3-4 weeks</option>
                  <option value="1-2months">1-2 months</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Range (₹)
                </label>
                <input
                  type="number"
                  value={quoteForm.budget}
                  onChange={(e) => setQuoteForm(prev => ({ ...prev, budget: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Starting from ₹${selectedService?.price?.toLocaleString()}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={quoteForm.additionalNotes}
                onChange={(e) => setQuoteForm(prev => ({ ...prev, additionalNotes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="Any additional information or special requirements..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Files (Optional)
              </label>
              <input
                type="file"
                multiple
                onChange={(e) => setQuoteForm(prev => ({ ...prev, files: Array.from(e.target.files) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <p className="text-xs text-gray-500 mt-1">
                Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB each)
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setShowQuoteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ServiceRequestsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Service Requests</h2>
        <button
          onClick={() => setActiveTab('services')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Request New Service
        </button>
      </div>

      {serviceRequests.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No service requests yet</h3>
          <p className="text-gray-500 mb-6">Start by requesting a service from our marketplace</p>
          <button
            onClick={() => setActiveTab('services')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Browse Services
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {serviceRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                  <p className="text-sm text-gray-500">Requested on {new Date(request.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${request.status === 'completed' ? 'bg-green-100 text-green-800' :
                    request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      request.status === 'quoted' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                    {request.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-lg font-bold text-green-600">₹{request.budget?.toLocaleString()}</span>
                </div>
              </div>

              <p className="text-gray-600 mb-4">{request.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {request.timeline || 'Timeline TBD'}
                  </span>
                  {request.assigned_to && (
                    <span className="flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      Assigned to specialist
                    </span>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View Details
                  </button>
                  {request.status === 'quoted' && (
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                      Accept Quote
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
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
      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('services')}
          className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${activeTab === 'services'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Browse Services
        </button>
        <button
          onClick={() => setActiveTab('business-essentials')}
          className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${activeTab === 'business-essentials'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Free Business Essentials
        </button>
        <button
          onClick={() => setActiveTab('my-requests')}
          className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-colors ${activeTab === 'my-requests'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          My Requests ({serviceRequests.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'services' && (
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Professional Services Marketplace</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get your startup essentials handled by experts. From legal setup to technology development,
              we've got everything you need to launch and scale your business.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {serviceCategories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filterCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              All Services
            </button>
            {serviceCategories.map(category => (
              <button
                key={category.id}
                onClick={() => setFilterCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-2 ${filterCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {React.createElement(category.icon, { className: "w-4 h-4" })}
                <span>{category.name}</span>
              </button>
            ))}
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'business-essentials' && (
        <div data-section="business-essentials">
          <BusinessEssentials user={user} />
        </div>
      )}

      {activeTab === 'my-requests' && <ServiceRequestsTab />}

      {/* Quote Request Modal */}
      {showQuoteModal && <QuoteRequestModal />}

      {/* Service Details Modal */}
      {selectedService && !showQuoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{selectedService.title}</h2>
                <button
                  onClick={() => setSelectedService(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Service Description</h3>
                    <p className="text-gray-600">{selectedService.description}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">What's Included</h3>
                    <ul className="space-y-2">
                      {selectedService.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Requirements</h3>
                    <ul className="space-y-2">
                      {selectedService.requirements.map((requirement, index) => (
                        <li key={index} className="flex items-center">
                          <FileText className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-600">{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="text-center mb-6">
                    <p className="text-3xl font-bold text-green-600 mb-2">₹{selectedService.price.toLocaleString()}</p>
                    <p className="text-gray-500">Starting price</p>
                    <p className="text-sm text-gray-500 mt-1">{selectedService.duration}</p>
                  </div>

                  <button
                    onClick={() => setShowQuoteModal(true)}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 font-medium mb-4"
                  >
                    Request Custom Quote
                  </button>

                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span>Quality guarantee</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span>Expert team assigned</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span>Regular progress updates</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span>Post-delivery support</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span>Revision rounds included</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Need Help?</h4>
                    <div className="space-y-2">
                      <button className="w-full text-left text-sm text-blue-600 hover:text-blue-800 flex items-center">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat with our experts
                      </button>
                      <button className="w-full text-left text-sm text-blue-600 hover:text-blue-800 flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule a consultation
                      </button>
                    </div>
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

export default ServicesMarketplace;