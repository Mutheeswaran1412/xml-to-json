import { useEffect, useState } from 'react';
import { Clock, Download, Trash2, FileCode2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase, ConversionRecord } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function ConversionHistory() {
  const { user } = useAuth();
  const [conversions, setConversions] = useState<ConversionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

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
          <h2 className="text-white font-semibold text-lg">Conversion History</h2>
          <p className="text-gray-400 text-sm mt-1">{conversions.length} conversions saved</p>
        </div>

        <div className="divide-y divide-white/10 max-h-96 overflow-y-auto">
          {conversions.map((conversion) => (
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
        </div>
      </div>
    </div>
  );
}
