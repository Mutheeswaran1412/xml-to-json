import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, Download, Calendar, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AnalyticsData {
  totalConversions: number;
  successRate: number;
  avgConversionTime: number;
  errorTrends: Array<{ date: string; count: number; type: string }>;
  performanceMetrics: Array<{ date: string; avgTime: number; fileCount: number }>;
  topErrors: Array<{ error: string; count: number; percentage: number }>;
  dailyStats: Array<{ date: string; conversions: number; errors: number }>;
}

export function AdvancedAnalytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'errors'>('summary');

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, dateRange]);

  const loadAnalytics = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      const { data: conversions, error } = await supabase
        .from('conversions')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      // Process analytics data
      const totalConversions = conversions?.length || 0;
      const successCount = conversions?.filter(c => c.status === 'success').length || 0;
      const successRate = totalConversions > 0 ? (successCount / totalConversions) * 100 : 0;
      const avgConversionTime = conversions?.reduce((sum, c) => sum + c.conversion_time_ms, 0) / totalConversions || 0;

      // Error analysis
      const errors = conversions?.filter(c => c.status === 'error') || [];
      const errorCounts: Record<string, number> = {};
      errors.forEach(error => {
        const errorType = error.error_message?.split(':')[0] || 'Unknown Error';
        errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
      });

      const topErrors = Object.entries(errorCounts)
        .map(([error, count]) => ({
          error,
          count,
          percentage: (count / errors.length) * 100
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Daily stats
      const dailyStats: Record<string, { conversions: number; errors: number }> = {};
      conversions?.forEach(conv => {
        const date = new Date(conv.created_at).toISOString().split('T')[0];
        if (!dailyStats[date]) {
          dailyStats[date] = { conversions: 0, errors: 0 };
        }
        dailyStats[date].conversions++;
        if (conv.status === 'error') {
          dailyStats[date].errors++;
        }
      });

      setAnalytics({
        totalConversions,
        successRate,
        avgConversionTime,
        errorTrends: [],
        performanceMetrics: [],
        topErrors,
        dailyStats: Object.entries(dailyStats).map(([date, stats]) => ({
          date,
          ...stats
        }))
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDFReport = () => {
    if (!analytics) return;

    const reportData = {
      title: 'XML to JSON Converter - Analytics Report',
      dateRange: dateRange,
      generatedAt: new Date().toLocaleString(),
      summary: {
        totalConversions: analytics.totalConversions,
        successRate: analytics.successRate.toFixed(1) + '%',
        avgConversionTime: analytics.avgConversionTime.toFixed(0) + 'ms'
      },
      topErrors: analytics.topErrors,
      dailyStats: analytics.dailyStats
    };

    // Simulate PDF generation
    const pdfContent = `
XML to JSON Converter - Analytics Report
Generated: ${reportData.generatedAt}
Date Range: ${dateRange}

SUMMARY
=======
Total Conversions: ${reportData.summary.totalConversions}
Success Rate: ${reportData.summary.successRate}
Average Conversion Time: ${reportData.summary.avgConversionTime}

TOP ERRORS
==========
${analytics.topErrors.map(error => 
  `${error.error}: ${error.count} occurrences (${error.percentage.toFixed(1)}%)`
).join('\n')}

DAILY STATISTICS
===============
${analytics.dailyStats.map(stat => 
  `${stat.date}: ${stat.conversions} conversions, ${stat.errors} errors`
).join('\n')}
    `;

    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${dateRange}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateExcelReport = () => {
    if (!analytics) return;

    const csvContent = [
      ['XML to JSON Converter Analytics Report'],
      ['Generated:', new Date().toLocaleString()],
      ['Date Range:', dateRange],
      [''],
      ['SUMMARY'],
      ['Metric', 'Value'],
      ['Total Conversions', analytics.totalConversions],
      ['Success Rate', analytics.successRate.toFixed(1) + '%'],
      ['Average Conversion Time', analytics.avgConversionTime.toFixed(0) + 'ms'],
      [''],
      ['TOP ERRORS'],
      ['Error Type', 'Count', 'Percentage'],
      ...analytics.topErrors.map(error => [error.error, error.count, error.percentage.toFixed(1) + '%']),
      [''],
      ['DAILY STATISTICS'],
      ['Date', 'Conversions', 'Errors'],
      ...analytics.dailyStats.map(stat => [stat.date, stat.conversions, stat.errors])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
        <BarChart3 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Sign in for Analytics</h3>
        <p className="text-gray-400">Create an account to access detailed analytics and reporting</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
        <p className="text-gray-400 mt-4">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Advanced Analytics</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
            
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">
                <Download className="w-4 h-4" />
                Export Report
              </button>
              <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={generatePDFReport}
                  className="block w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded-t-lg whitespace-nowrap"
                >
                  Export as PDF
                </button>
                <button
                  onClick={generateExcelReport}
                  className="block w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded-b-lg whitespace-nowrap"
                >
                  Export as Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        {analytics && (
          <>
            {/* Key Metrics */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-400 text-sm">Total Conversions</span>
                </div>
                <div className="text-2xl font-bold text-white">{analytics.totalConversions}</div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-gray-400 text-sm">Success Rate</span>
                </div>
                <div className="text-2xl font-bold text-green-400">{analytics.successRate.toFixed(1)}%</div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-400 text-sm">Avg Time</span>
                </div>
                <div className="text-2xl font-bold text-purple-400">{analytics.avgConversionTime.toFixed(0)}ms</div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="text-gray-400 text-sm">Error Rate</span>
                </div>
                <div className="text-2xl font-bold text-red-400">{(100 - analytics.successRate).toFixed(1)}%</div>
              </div>
            </div>

            {/* Error Analysis */}
            {analytics.topErrors.length > 0 && (
              <div className="bg-white/5 rounded-lg p-6 mb-6">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  Top Error Types
                </h3>
                <div className="space-y-3">
                  {analytics.topErrors.map((error, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-white font-medium">{error.error}</div>
                        <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${error.percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-white font-medium">{error.count}</div>
                        <div className="text-gray-400 text-sm">{error.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Statistics Chart */}
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-white font-medium mb-4">Daily Activity</h3>
              <div className="space-y-2">
                {analytics.dailyStats.slice(-7).map((stat, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <span className="text-gray-400">{new Date(stat.date).toLocaleDateString()}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-green-400">{stat.conversions} conversions</span>
                      <span className="text-red-400">{stat.errors} errors</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}