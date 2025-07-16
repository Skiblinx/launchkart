import React, { useState, useEffect } from 'react';
import { Download, Eye, ExternalLink, Play, Image, FileText, Video, Palette, Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { apiRequest } from '../App';

const BusinessEssentials = ({ user }) => {
  const [assets, setAssets] = useState({});
  const [loading, setLoading] = useState(true);
  const [generatingAssets, setGeneratingAssets] = useState(new Set());
  const [previewModal, setPreviewModal] = useState(null);

  useEffect(() => {
    fetchUserAssets();
  }, []);

  const fetchUserAssets = async () => {
    try {
      const response = await apiRequest('get', '/business-essentials/user-assets');
      setAssets(response.data.assets || {});
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestAssetGeneration = async (assetType) => {
    try {
      setGeneratingAssets(prev => new Set(prev).add(assetType));
      const response = await apiRequest('post', '/business-essentials/generate-asset', { asset_type: assetType });
      if (response && response.data && response.data.asset) {
        setAssets(prev => ({
          ...prev,
          [assetType]: {
            ...response.data.asset,
            status: 'generating',
            requested_at: new Date().toISOString()
          }
        }));
        pollAssetStatus(assetType);
      } else {
        throw new Error('Failed to request asset generation');
      }
    } catch (error) {
      console.error('Failed to request asset:', error);
      setGeneratingAssets(prev => {
        const newSet = new Set(prev);
        newSet.delete(assetType);
        return newSet;
      });
    }
  };

  const pollAssetStatus = async (assetType) => {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;
    const poll = async () => {
      try {
        const response = await apiRequest('get', `/business-essentials/asset-status/${assetType}`);
        if (response && response.data) {
          const data = response.data;
          if (data.status === 'ready') {
            setAssets(prev => ({
              ...prev,
              [assetType]: data.asset
            }));
            setGeneratingAssets(prev => {
              const newSet = new Set(prev);
              newSet.delete(assetType);
              return newSet;
            });
            return;
          } else if (data.status === 'failed') {
            setGeneratingAssets(prev => {
              const newSet = new Set(prev);
              newSet.delete(assetType);
              return newSet;
            });
            return;
          }
        }
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          setGeneratingAssets(prev => {
            const newSet = new Set(prev);
            newSet.delete(assetType);
            return newSet;
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
        setGeneratingAssets(prev => {
          const newSet = new Set(prev);
          newSet.delete(assetType);
          return newSet;
        });
      }
    };
    poll();
  };

  const downloadAsset = async (assetType, assetId) => {
    try {
      const response = await apiRequest('get', `/business-essentials/download/${assetId}`, null, { responseType: 'blob' });
      if (response && response.data) {
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${assetType}_${user.fullName?.replace(/\s+/g, '_') || 'asset'}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const AssetCard = ({ assetType, assetConfig, asset }) => {
    const isGenerating = generatingAssets.has(assetType);
    const hasAsset = asset && asset.status === 'ready';
    const hasFailed = asset && asset.status === 'failed';

    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 ${assetConfig.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <assetConfig.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{assetConfig.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{assetConfig.description}</p>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="flex-shrink-0 ml-2">
              {hasAsset && <CheckCircle className="w-5 h-5 text-green-500" />}
              {hasFailed && <AlertCircle className="w-5 h-5 text-red-500" />}
              {isGenerating && <Clock className="w-5 h-5 text-blue-500 animate-pulse" />}
            </div>
          </div>

          {/* Content Area */}
          <div className="space-y-4">
            {!hasAsset && !isGenerating && !hasFailed && (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <assetConfig.icon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-3">
                  Get your professional {assetConfig.title.toLowerCase()} instantly
                </p>
                <button
                  onClick={() => requestAssetGeneration(assetType)}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generate {assetConfig.title}</span>
                </button>
              </div>
            )}

            {isGenerating && (
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                <p className="text-sm text-blue-700 font-medium mb-1">
                  Generating your {assetConfig.title.toLowerCase()}...
                </p>
                <p className="text-xs text-blue-600">
                  This usually takes 30-60 seconds
                </p>
              </div>
            )}

            {hasFailed && (
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-700 mb-3">
                  Generation failed. Please try again.
                </p>
                <button
                  onClick={() => requestAssetGeneration(assetType)}
                  className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Retry Generation
                </button>
              </div>
            )}

            {hasAsset && (
              <div className="space-y-3">
                {/* Preview Area */}
                <div className="bg-gray-50 rounded-lg p-3">
                  {asset.preview_url && (
                    <img
                      src={asset.preview_url}
                      alt={`${assetConfig.title} preview`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}
                  {!asset.preview_url && (
                    <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      <assetConfig.icon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => setPreviewModal({ assetType, asset, config: assetConfig })}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={() => downloadAsset(assetType, asset.id)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>

                {asset.live_url && (
                  <button
                    onClick={() => window.open(asset.live_url, '_blank')}
                    className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View Live</span>
                  </button>
                )}

                <div className="text-xs text-gray-500 text-center">
                  Generated {new Date(asset.created_at).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const PreviewModal = ({ modalData, onClose }) => {
    if (!modalData) return null;

    const { assetType, asset, config } = modalData;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl max-h-[90vh] overflow-auto w-full">
          <div className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center space-x-3">
                <config.icon className="w-6 h-6 text-gray-700" />
                <span>{config.title} Preview</span>
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {assetType === 'logo' && asset.variants && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {asset.variants.map((variant, index) => (
                    <div key={index} className="border rounded-lg p-4 text-center">
                      <img src={variant.url} alt={`Logo variant ${index + 1}`} className="mx-auto mb-2 max-h-24" />
                      <p className="text-sm text-gray-600">{variant.name}</p>
                    </div>
                  ))}
                </div>
              )}

              {assetType === 'landing_page' && asset.preview_url && (
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    src={asset.preview_url}
                    className="w-full h-96"
                    title="Landing Page Preview"
                  />
                </div>
              )}

              {assetType === 'social_creatives' && asset.creatives && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {asset.creatives.map((creative, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <img src={creative.url} alt={`Social creative ${index + 1}`} className="w-full h-48 object-cover" />
                      <div className="p-3">
                        <p className="text-sm font-medium">{creative.platform}</p>
                        <p className="text-xs text-gray-600">{creative.dimensions}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {assetType === 'promo_video' && asset.embed_url && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={asset.embed_url}
                    className="w-full h-full"
                    title="Promo Video"
                    allowFullScreen
                  />
                </div>
              )}

              {assetType === 'mockups' && asset.mockups && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {asset.mockups.map((mockup, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <img src={mockup.url} alt={`Mockup ${index + 1}`} className="w-full h-48 object-cover" />
                      <div className="p-3">
                        <p className="text-sm font-medium">{mockup.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const assetConfigs = {
    logo: {
      title: 'Professional Logo',
      description: 'Multiple variants in high resolution',
      icon: Palette,
      color: 'bg-purple-500'
    },
    landing_page: {
      title: 'Landing Page',
      description: 'Responsive one-page website',
      icon: FileText,
      color: 'bg-blue-500'
    },
    social_creatives: {
      title: 'Social Media Pack',
      description: '5 platform-optimized designs',
      icon: Image,
      color: 'bg-pink-500'
    },
    promo_video: {
      title: 'Promo Video',
      description: '30-second marketing video',
      icon: Video,
      color: 'bg-red-500'
    },
    mockups: {
      title: 'Product Mockups',
      description: 'Business cards, merchandise, etc.',
      icon: Eye,
      color: 'bg-green-500'
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white text-lg">🎁</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Your Free Business Essentials</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-gray-200 rounded-xl h-64 sm:h-72 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // Check if user has basic KYC
  if (user.kyc_level === 'none') {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8" data-section="business-essentials">
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white text-lg">🎁</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Your Free Business Essentials</h2>
        </div>

        <div className="text-center py-8 sm:py-12">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
            Complete Basic KYC to Access Free Assets
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Verify your identity to unlock your free business starter package including logo, landing page, and more.
          </p>
          <a
            href="/kyc"
            className="inline-flex items-center bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Complete KYC Verification
          </a>
        </div>
      </div>
    );
  }

  const readyAssets = Object.values(assets).filter(asset => asset?.status === 'ready').length;
  const totalAssets = Object.keys(assetConfigs).length;

  return (
    <section className="bg-white rounded-2xl shadow-2xl p-8 sm:p-12 mb-8 border border-gray-100 max-w-7xl mx-auto" data-section="business-essentials">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-2xl">🎁</span>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Your Free Business Essentials</h2>
            <p className="text-base text-gray-500 mt-1">
              {readyAssets}/{totalAssets} assets generated
            </p>
          </div>
        </div>

        {readyAssets > 0 && (
          <div className="flex items-center gap-3">
            <div className="w-48 bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(readyAssets / totalAssets) * 100}%` }}
              ></div>
            </div>
            <span className="text-base text-gray-600 font-medium">
              {Math.round((readyAssets / totalAssets) * 100)}%
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(assetConfigs).map(([assetType, config]) => (
          <AssetCard
            key={assetType}
            assetType={assetType}
            assetConfig={config}
            asset={assets[assetType]}
          />
        ))}
      </div>

      {readyAssets === totalAssets && (
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 shadow text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">🚀 Complete Package Ready!</h3>
          <p className="text-gray-700 mb-4 text-lg">
            All your business essentials are ready to download. Start building your brand presence today!
          </p>
        </div>
      )}

      <PreviewModal modalData={previewModal} onClose={() => setPreviewModal(null)} />
    </section>
  );
};

export default BusinessEssentials; 