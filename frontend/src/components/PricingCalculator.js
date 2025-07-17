import React, { useState, useEffect } from 'react';
import { apiRequest } from '../App';
import { Calculator, Check, AlertCircle, Clock, MapPin, Zap } from 'lucide-react';

const PricingCalculator = ({ service, onPriceCalculated, onClose }) => {
  const [config, setConfig] = useState({});
  const [serviceConfig, setServiceConfig] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    fetchServiceConfig();
  }, [service.id]);

  const fetchServiceConfig = async () => {
    try {
      const response = await apiRequest('get', `/pricing/service-config/${service.id}`);
      setServiceConfig(response.data);
      
      // Initialize with default values
      const defaultConfig = {
        urgency: 'normal',
        location: 'metro',
        complexity: 'simple'
      };
      
      if (response.data.pricing_type === 'tiered') {
        defaultConfig.tier = response.data.tiers[0]?.name || 'Basic';
      }
      
      setConfig(defaultConfig);
    } catch (error) {
      console.error('Failed to fetch service config:', error);
      setError('Failed to load pricing configuration');
    }
  };

  const calculatePrice = async () => {
    setCalculating(true);
    setError(null);
    
    try {
      const response = await apiRequest('post', '/pricing/calculate', {
        service_id: service.id,
        configuration: JSON.stringify(config)
      }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      setCalculatedPrice(response.data);
      onPriceCalculated(response.data);
    } catch (error) {
      console.error('Failed to calculate price:', error);
      setError('Failed to calculate price. Please try again.');
    } finally {
      setCalculating(false);
    }
  };

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleModuleToggle = (moduleName) => {
    setConfig(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [moduleName]: !prev.modules?.[moduleName]
      }
    }));
  };

  const handleFeatureToggle = (featureName) => {
    setConfig(prev => ({
      ...prev,
      features: prev.features?.includes(featureName) 
        ? prev.features.filter(f => f !== featureName)
        : [...(prev.features || []), featureName]
    }));
  };

  const handleDocumentToggle = (docName) => {
    setConfig(prev => ({
      ...prev,
      documents: prev.documents?.includes(docName)
        ? prev.documents.filter(d => d !== docName)
        : [...(prev.documents || []), docName]
    }));
  };

  if (!serviceConfig) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calculator className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold">Price Calculator: {service.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Configuration Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Common Factors */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-4">Project Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Zap className="w-4 h-4 inline mr-1" />
                      Urgency
                    </label>
                    <select
                      value={config.urgency}
                      onChange={(e) => handleConfigChange('urgency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="flexible">Flexible Timeline (+10% off)</option>
                      <option value="normal">Normal Timeline</option>
                      <option value="urgent">Urgent (+50% extra)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Location
                    </label>
                    <select
                      value={config.location}
                      onChange={(e) => handleConfigChange('location', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="tier3">Tier 3 Cities (+20% off)</option>
                      <option value="tier2">Tier 2 Cities (+10% off)</option>
                      <option value="metro">Metro Cities</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Complexity
                    </label>
                    <select
                      value={config.complexity}
                      onChange={(e) => handleConfigChange('complexity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="simple">Simple</option>
                      <option value="medium">Medium (+20% extra)</option>
                      <option value="complex">Complex (+50% extra)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Service-Specific Configuration */}
              {serviceConfig.pricing_type === 'tiered' && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-4">Select Package</h3>
                  <div className="space-y-3">
                    {serviceConfig.tiers.map((tier) => (
                      <div
                        key={tier.name}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          config.tier === tier.name
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleConfigChange('tier', tier.name)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{tier.name}</h4>
                            <p className="text-sm text-gray-600">
                              {tier.features.slice(0, 2).join(', ')}
                              {tier.features.length > 2 && ` +${tier.features.length - 2} more`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">₹{tier.price.toLocaleString()}</p>
                            {config.tier === tier.name && <Check className="w-4 h-4 text-blue-600 mt-1" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {serviceConfig.pricing_type === 'modular' && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-4">Select Modules</h3>
                  <div className="space-y-3">
                    {serviceConfig.modules.map((module) => (
                      <div
                        key={module.name}
                        className={`p-3 border rounded-lg ${
                          module.required ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={module.required || config.modules?.[module.name]}
                              onChange={() => !module.required && handleModuleToggle(module.name)}
                              disabled={module.required}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div>
                              <h4 className="font-medium">{module.name}</h4>
                              {module.required && <span className="text-xs text-blue-600">Required</span>}
                            </div>
                          </div>
                          <p className="font-medium text-green-600">₹{module.price.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {serviceConfig.pricing_type === 'platform_based' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Select Platform</h3>
                    <div className="space-y-3">
                      {serviceConfig.platforms.map((platform) => (
                        <div
                          key={platform.name}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            config.platform === platform.name
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleConfigChange('platform', platform.name)}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{platform.name}</h4>
                            <p className="font-bold text-green-600">₹{platform.price.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Additional Features</h3>
                    <div className="space-y-3">
                      {serviceConfig.features.map((feature) => (
                        <div
                          key={feature.name}
                          className={`p-3 border rounded-lg ${
                            feature.required ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={feature.required || config.features?.includes(feature.name)}
                                onChange={() => !feature.required && handleFeatureToggle(feature.name)}
                                disabled={feature.required}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <div>
                                <h4 className="font-medium">{feature.name}</h4>
                                {feature.required && <span className="text-xs text-blue-600">Required</span>}
                              </div>
                            </div>
                            <p className="font-medium text-green-600">₹{feature.price.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {serviceConfig.pricing_type === 'document_based' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Select Package or Individual Documents</h3>
                    
                    {serviceConfig.packages && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Pre-defined Packages</h4>
                        <div className="space-y-2">
                          {serviceConfig.packages.map((pkg) => (
                            <div
                              key={pkg.name}
                              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                config.package === pkg.name
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => handleConfigChange('package', pkg.name)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-medium">{pkg.name}</h5>
                                  <p className="text-sm text-gray-600">
                                    {pkg.documents.join(', ')}
                                  </p>
                                </div>
                                <p className="font-bold text-green-600">₹{pkg.price.toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Or Choose Individual Documents</h4>
                      <div className="space-y-2">
                        {serviceConfig.documents.map((doc) => (
                          <div
                            key={doc.name}
                            className="p-3 border rounded-lg border-gray-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={config.documents?.includes(doc.name)}
                                  onChange={() => handleDocumentToggle(doc.name)}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <h5 className="font-medium">{doc.name}</h5>
                              </div>
                              <p className="font-medium text-green-600">₹{doc.price.toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Price Summary */}
            <div className="bg-gray-50 rounded-lg p-6 h-fit">
              <h3 className="font-semibold mb-4">Price Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span>Base Price</span>
                  <span>₹{serviceConfig.base_price.toLocaleString()}</span>
                </div>
                
                {calculatedPrice && (
                  <>
                    {calculatedPrice.price_breakdown.adjustments.map((adj, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="capitalize">{adj.factor}: {adj.value}</span>
                        <span className={adj.adjustment > 0 ? 'text-red-600' : 'text-green-600'}>
                          {adj.adjustment > 0 ? '+' : ''}₹{adj.adjustment.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    
                    {calculatedPrice.price_breakdown.modules.map((module, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{module.name}</span>
                        <span>₹{module.price.toLocaleString()}</span>
                      </div>
                    ))}
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>₹{calculatedPrice.price_breakdown.total_before_tax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>GST (18%)</span>
                        <span>₹{calculatedPrice.price_breakdown.tax_amount.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-green-600">₹{calculatedPrice.price_breakdown.total_amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={calculatePrice}
                  disabled={calculating}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {calculating ? 'Calculating...' : 'Calculate Price'}
                </button>
                
                {calculatedPrice && (
                  <button
                    onClick={() => {
                      onPriceCalculated(calculatedPrice);
                      onClose();
                    }}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium"
                  >
                    Use This Price
                  </button>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingCalculator;