import React, { useState, useEffect } from 'react';
import { apiRequest } from '../App';
import { 
  CreditCard, Clock, CheckCircle, AlertCircle, Download, 
  Filter, Search, Calendar, DollarSign, FileText, RefreshCw 
} from 'lucide-react';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('get', '/payments/payment-history');
      setPayments(response.data || []);
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
      setError('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesSearch = payment.service_request_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.gateway_payment_id?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const downloadInvoice = async (paymentId) => {
    try {
      // This would be implemented to generate and download invoice
      console.log('Downloading invoice for payment:', paymentId);
      alert('Invoice download functionality will be implemented');
    } catch (error) {
      console.error('Failed to download invoice:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <CreditCard className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
        </div>
        <button
          onClick={fetchPaymentHistory}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by payment ID or service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Payments</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {filteredPayments.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {payments.length === 0 ? 'No payments yet' : 'No payments found'}
          </h3>
          <p className="text-gray-500">
            {payments.length === 0 
              ? 'Your payment history will appear here after you make your first purchase'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(payment.status)}`}>
                    {getStatusIcon(payment.status)}
                    <span className="capitalize">{payment.status}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(payment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {payment.currency} {payment.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">{payment.gateway}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-sm text-gray-600">Service Request ID</p>
                  <p className="font-medium text-gray-900">{payment.service_request_id}</p>
                </div>
                {payment.gateway_payment_id && (
                  <div>
                    <p className="text-sm text-gray-600">Payment ID</p>
                    <p className="font-medium text-gray-900 font-mono text-sm">{payment.gateway_payment_id}</p>
                  </div>
                )}
              </div>

              {payment.metadata && Object.keys(payment.metadata).length > 0 && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-1">Additional Information</p>
                  <div className="bg-gray-50 rounded p-2 text-sm">
                    {payment.metadata.refund_reason && (
                      <p><strong>Refund Reason:</strong> {payment.metadata.refund_reason}</p>
                    )}
                    {payment.metadata.refund_amount && (
                      <p><strong>Refund Amount:</strong> {payment.currency} {payment.metadata.refund_amount}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(payment.created_at).toLocaleString()}
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  {payment.status === 'completed' && (
                    <button
                      onClick={() => downloadInvoice(payment.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download Invoice
                    </button>
                  )}
                  
                  {payment.status === 'failed' && (
                    <button
                      className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                      onClick={() => {
                        // Implement retry payment functionality
                        alert('Retry payment functionality will be implemented');
                      }}
                    >
                      Retry Payment
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {payments.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm text-green-600">Total Completed</p>
                <p className="font-bold text-green-800">
                  {payments.filter(p => p.status === 'completed').length} payments
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-blue-600">Total Amount</p>
                <p className="font-bold text-blue-800">
                  ₹{payments
                    .filter(p => p.status === 'completed')
                    .reduce((sum, p) => sum + p.amount, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-sm text-yellow-600">Pending</p>
                <p className="font-bold text-yellow-800">
                  {payments.filter(p => ['pending', 'processing'].includes(p.status)).length} payments
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;