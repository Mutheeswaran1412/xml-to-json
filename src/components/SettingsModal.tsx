import { useState } from 'react';
import { X, Settings, Download, Upload, RotateCcw } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, resetSettings, exportSettings, importSettings } = useSettings();
  const [importText, setImportText] = useState('');

  if (!isOpen) return null;

  const handleExport = () => {
    const blob = new Blob([exportSettings()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'xml-converter-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      importSettings(importText);
      setImportText('');
      alert('Settings imported successfully!');
    } catch (error) {
      alert('Failed to import settings. Please check the format.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-white/10 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Advanced Settings</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Conversion Settings */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Conversion Settings</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.preserveAttributes}
                  onChange={(e) => updateSettings({ preserveAttributes: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                />
                <span className="text-gray-300">Preserve XML attributes</span>
              </label>
              
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => updateSettings({ autoSave: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                />
                <span className="text-gray-300">Auto-save conversions</span>
              </label>
            </div>
          </div>

          {/* Output Format */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Output Format</h3>
            <div className="space-y-2">
              {(['pretty', 'minified', 'compact'] as const).map((format) => (
                <label key={format} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="outputFormat"
                    value={format}
                    checked={settings.outputFormat === format}
                    onChange={(e) => updateSettings({ outputFormat: e.target.value as any })}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600"
                  />
                  <span className="text-gray-300 capitalize">{format} JSON</span>
                </label>
              ))}
            </div>
          </div>

          {/* Performance Settings */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Performance</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Performance Mode</label>
                <select
                  value={settings.performanceMode}
                  onChange={(e) => updateSettings({ performanceMode: e.target.value as any })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="fast">Fast (Less memory usage)</option>
                  <option value="balanced">Balanced</option>
                  <option value="memory">Memory Optimized</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Max File Size (KB)</label>
                <input
                  type="number"
                  value={settings.maxFileSize}
                  onChange={(e) => updateSettings({ maxFileSize: parseInt(e.target.value) })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  min="100"
                  max="10240"
                />
              </div>
            </div>
          </div>

          {/* File Filters */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">File Filters</h3>
            <div className="flex flex-wrap gap-2">
              {settings.fileFilters.map((filter, index) => (
                <span key={index} className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm">
                  {filter}
                </span>
              ))}
            </div>
          </div>

          {/* Backup & Restore */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Backup & Restore</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  <Download className="w-4 h-4" />
                  Export Settings
                </button>
                <button
                  onClick={resetSettings}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset to Default
                </button>
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Import Settings</label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste settings JSON here..."
                  className="w-full h-24 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                />
                <button
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg"
                >
                  <Upload className="w-4 h-4" />
                  Import Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}