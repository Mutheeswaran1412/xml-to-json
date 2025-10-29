import { useState } from 'react';
import { Cloud, Upload, Download, Settings, Key, CheckCircle2 } from 'lucide-react';

interface CloudProvider {
  name: string;
  icon: string;
  connected: boolean;
  apiKey?: string;
}

export function CloudStorage() {
  const [providers, setProviders] = useState<CloudProvider[]>([
    { name: 'Google Drive', icon: '🔵', connected: false },
    { name: 'Dropbox', icon: '🔷', connected: false },
    { name: 'AWS S3', icon: '🟠', connected: false }
  ]);
  
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [apiKey, setApiKey] = useState('');
  const [bucketName, setBucketName] = useState('');

  const connectProvider = (providerName: string) => {
    if (!apiKey) {
      alert('Please enter API key');
      return;
    }
    
    setProviders(prev => prev.map(p => 
      p.name === providerName 
        ? { ...p, connected: true, apiKey }
        : p
    ));
    
    setApiKey('');
    setSelectedProvider('');
    alert(`Connected to ${providerName} successfully!`);
  };

  const uploadToCloud = async (provider: string, data: string, filename: string) => {
    // Simulate cloud upload
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`File uploaded to ${provider}: ${filename}`);
    } catch (error) {
      alert('Upload failed. Please check your connection.');
    }
  };

  const downloadFromCloud = async (provider: string, filename: string) => {
    // Simulate cloud download
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const sampleData = '{"message": "Downloaded from ' + provider + '"}';
      const blob = new Blob([sampleData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Download failed. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Cloud className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Cloud Storage Integration</h2>
        </div>

        {/* Provider Status */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {providers.map((provider) => (
            <div key={provider.name} className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{provider.icon}</span>
                  <span className="text-white font-medium">{provider.name}</span>
                </div>
                {provider.connected ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <button
                    onClick={() => setSelectedProvider(provider.name)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              {provider.connected && (
                <div className="space-y-2">
                  <button
                    onClick={() => uploadToCloud(provider.name, '{"test": "data"}', 'test.json')}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </button>
                  <button
                    onClick={() => downloadFromCloud(provider.name, 'download.json')}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Connection Setup */}
        {selectedProvider && (
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-white font-medium mb-4">Connect to {selectedProvider}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">API Key / Access Token</label>
                <div className="flex gap-2">
                  <Key className="w-5 h-5 text-gray-400 mt-2" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>
              
              {selectedProvider === 'AWS S3' && (
                <div>
                  <label className="block text-gray-300 mb-2">Bucket Name</label>
                  <input
                    type="text"
                    value={bucketName}
                    onChange={(e) => setBucketName(e.target.value)}
                    placeholder="my-xml-converter-bucket"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={() => connectProvider(selectedProvider)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Connect
                </button>
                <button
                  onClick={() => setSelectedProvider('')}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-blue-600/20 border border-blue-500/50 rounded-lg p-4">
          <h4 className="text-blue-300 font-medium mb-2">Setup Instructions:</h4>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• <strong>Google Drive:</strong> Create OAuth2 credentials in Google Cloud Console</li>
            <li>• <strong>Dropbox:</strong> Generate access token in Dropbox App Console</li>
            <li>• <strong>AWS S3:</strong> Create IAM user with S3 permissions and get access keys</li>
          </ul>
        </div>
      </div>
    </div>
  );
}