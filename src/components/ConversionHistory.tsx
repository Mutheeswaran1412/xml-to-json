import { useEffect, useState } from 'react';
import { Clock, Download, Trash2, FileCode2, CheckCircle2, AlertCircle, Search, Filter, BarChart3, FileDown } from 'lucide-react';
import { supabase, ConversionRecord } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Analytics {
  totalConversions: number;
  successRate: number;
  avgConversionTime: number;
  totalDataProcessed: number;
  errorCount: number;
}

export function ConversionHistory() {
  const { user } = useAuth();
  const [conversions, setConversions] = useState<ConversionRecord[]>([]);
  const [filteredConversions, setFilteredConversions] = useState<ConversionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  useEffect(() => {
    filterConversions();
    calculateAnalytics();
  }, [conversions, searchTerm, statusFilter]);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('conversions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setConversions(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterConversions = () => {
    let filtered = conversions;
    
    if (searchTerm) {
      filtered = filtered.filter(conv => 
        conv.filename?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(conv => conv.status === statusFilter);
    }
    
    setFilteredConversions(filtered);
  };

  const calculateAnalytics = () => {
    if (conversions.length === 0) {
      setAnalytics(null);
      return;
    }

    const successCount = conversions.filter(c => c.status === 'success').length;
    const totalTime = conversions.reduce((sum, c) => sum + c.conversion_time_ms, 0);
    const totalSize = conversions.reduce((sum, c) => sum + c.file_size, 0);
    
    setAnalytics({
      totalConversions: conversions.length,
      successRate: (successCount / conversions.length) * 100,
      avgConversionTime: totalTime / conversions.length,
      totalDataProcessed: totalSize,
      errorCount: conversions.length - successCount
    });
  };

  const exportHistory = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      const headers = ['Filename', 'Status', 'File Size (KB)', 'Conversion Time (ms)', 'Created At'];
      const csvContent = [
        headers.join(','),
        ...filteredConversions.map(c => [
          c.filename || 'Unknown',
          c.status,
          (c.file_size / 1024).toFixed(2),
          c.conversion_time_ms,
          new Date(c.created_at).toLocaleString()
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'conversion-history.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([JSON.stringify(filteredConversions, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'conversion-history.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('conversions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setConversions(conversions.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting conversion:', error);
    }
  };

  const handleDownload = (conversion: ConversionRecord) => {
    if (conversion.json_output) {
      const blob = new Blob([conversion.json_output], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = conversion.filename ? conversion.filename.replace('.xml', '.json') : 'converted.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
        <FileCode2 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Sign in to view history
        </h3>
        <p className="text-gray-400">
          Create an account to save and access your conversion history
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
        <p className="text-gray-400 mt-4">Loading history...</p>
      </div>
    );
  }

  if (conversions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
        <FileCode2 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          No conversion history yet
        </h3>
        <p className="text-gray-400">
          Your conversions will appear here once you start converting XML files
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
        <div className="bg-black/20 px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white font-semibold text-lg">Conversion History</h2>
              <p className="text-gray-400 text-sm mt-1">{conversions.length} conversions saved</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">
                  <FileDown className="w-4 h-4" />
                  Export
                </button>
                <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => exportHistory('csv')}
                    className="block w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded-t-lg whitespace-nowrap"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => exportHistory('json')}
                    className="block w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded-b-lg whitespace-nowrap"
                  >
                    Export as JSON
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by filename..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>
          
          {showAnalytics && analytics && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-2xl font-bold text-white">{analytics.totalConversions}</div>
                <div className="text-xs text-gray-400">Total</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-400">{analytics.successRate.toFixed(1)}%</div>
                <div className="text-xs text-gray-400">Success Rate</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-400">{analytics.avgConversionTime.toFixed(0)}ms</div>
                <div className="text-xs text-gray-400">Avg Time</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-2xl font-bold text-purple-400">{(analytics.totalDataProcessed / 1024).toFixed(1)}KB</div>
                <div className="text-xs text-gray-400">Data Processed</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-2xl font-bold text-red-400">{analytics.errorCount}</div>
                <div className="text-xs text-gray-400">Errors</div>
              </div>
            </div>
          )}
        </div>

        <div className="divide-y divide-white/10 max-h-96 overflow-y-auto">
          {filteredConversions.length === 0 ? (
            <div className="p-8 text-center">
              <FileCode2 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No conversions match your search criteria</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-2 bg-white/5 text-sm text-gray-400">
                Showing {filteredConversions.length} of {conversions.length} conversions
              </div>
              {filteredConversions.map((conversion) => (
            <div key={conversion.id} className="p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {conversion.status === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                    <h3 className="font-semibold text-white truncate">
                      {conversion.filename || 'Unnamed conversion'}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(conversion.created_at)}</span>
                    </div>
                    <span>Size: {formatFileSize(conversion.file_size)}</span>
                    <span>Time: {conversion.conversion_time_ms}ms</span>
                  </div>

                  {conversion.error_message && (
                    <p className="mt-2 text-sm text-red-400">
                      Error: {conversion.error_message}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {conversion.status === 'success' && (
                    <button
                      onClick={() => handleDownload(conversion)}
                      className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Download JSON"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(conversion.id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
