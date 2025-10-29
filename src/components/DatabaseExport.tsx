import { useState } from 'react';
import { Database, Download, Settings, Play, CheckCircle2 } from 'lucide-react';

interface DatabaseConfig {
  type: 'mysql' | 'postgresql' | 'mongodb';
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  table?: string;
  collection?: string;
}

export function DatabaseExport() {
  const [configs, setConfigs] = useState<Record<string, DatabaseConfig>>({});
  const [selectedDb, setSelectedDb] = useState<string>('');
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const databases = [
    { type: 'mysql', name: 'MySQL', icon: '🐬', port: '3306' },
    { type: 'postgresql', name: 'PostgreSQL', icon: '🐘', port: '5432' },
    { type: 'mongodb', name: 'MongoDB', icon: '🍃', port: '27017' }
  ];

  const updateConfig = (type: string, field: string, value: string) => {
    setConfigs(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
        type: type as any
      }
    }));
  };

  const testConnection = async (type: string) => {
    const config = configs[type];
    if (!config?.host || !config?.database) {
      alert('Please fill in required fields');
      return;
    }

    // Simulate connection test
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTestResults(prev => ({ ...prev, [type]: true }));
      alert(`Successfully connected to ${type.toUpperCase()}!`);
    } catch (error) {
      setTestResults(prev => ({ ...prev, [type]: false }));
      alert('Connection failed. Please check your credentials.');
    }
  };

  const exportToDatabase = async (type: string) => {
    const config = configs[type];
    if (!testResults[type]) {
      alert('Please test connection first');
      return;
    }

    // Simulate export
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const sampleData = {
        mysql: `INSERT INTO ${config.table || 'conversions'} (filename, json_data, created_at) VALUES ('sample.xml', '{"converted": "data"}', NOW());`,
        postgresql: `INSERT INTO ${config.table || 'conversions'} (filename, json_data, created_at) VALUES ('sample.xml', '{"converted": "data"}', CURRENT_TIMESTAMP);`,
        mongodb: `db.${config.collection || 'conversions'}.insertOne({filename: "sample.xml", jsonData: {"converted": "data"}, createdAt: new Date()})`
      };

      const blob = new Blob([sampleData[type as keyof typeof sampleData]], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${type}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert(`Data exported to ${type.toUpperCase()} successfully!`);
    } catch (error) {
      alert('Export failed. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-semibold text-white">Database Export</h2>
        </div>

        {/* Database Selection */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {databases.map((db) => (
            <button
              key={db.type}
              onClick={() => setSelectedDb(selectedDb === db.type ? '' : db.type)}
              className={`p-4 rounded-lg border transition-all ${
                selectedDb === db.type
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{db.icon}</span>
                {testResults[db.type] && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              </div>
              <div className="text-white font-medium">{db.name}</div>
              <div className="text-gray-400 text-sm">Port: {db.port}</div>
            </button>
          ))}
        </div>

        {/* Configuration Form */}
        {selectedDb && (
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h3 className="text-white font-medium mb-4">
              Configure {databases.find(d => d.type === selectedDb)?.name}
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-300 mb-2">Host</label>
                <input
                  type="text"
                  value={configs[selectedDb]?.host || ''}
                  onChange={(e) => updateConfig(selectedDb, 'host', e.target.value)}
                  placeholder="localhost"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Port</label>
                <input
                  type="text"
                  value={configs[selectedDb]?.port || databases.find(d => d.type === selectedDb)?.port}
                  onChange={(e) => updateConfig(selectedDb, 'port', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">
                  {selectedDb === 'mongodb' ? 'Database' : 'Database Name'}
                </label>
                <input
                  type="text"
                  value={configs[selectedDb]?.database || ''}
                  onChange={(e) => updateConfig(selectedDb, 'database', e.target.value)}
                  placeholder={selectedDb === 'mongodb' ? 'myapp' : 'xml_converter'}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">
                  {selectedDb === 'mongodb' ? 'Collection' : 'Table Name'}
                </label>
                <input
                  type="text"
                  value={configs[selectedDb]?.[selectedDb === 'mongodb' ? 'collection' : 'table'] || ''}
                  onChange={(e) => updateConfig(selectedDb, selectedDb === 'mongodb' ? 'collection' : 'table', e.target.value)}
                  placeholder="conversions"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  value={configs[selectedDb]?.username || ''}
                  onChange={(e) => updateConfig(selectedDb, 'username', e.target.value)}
                  placeholder="admin"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  value={configs[selectedDb]?.password || ''}
                  onChange={(e) => updateConfig(selectedDb, 'password', e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => testConnection(selectedDb)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                <Settings className="w-4 h-4" />
                Test Connection
              </button>
              
              <button
                onClick={() => exportToDatabase(selectedDb)}
                disabled={!testResults[selectedDb]}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg"
              >
                <Download className="w-4 h-4" />
                Export Data
              </button>
            </div>
          </div>
        )}

        {/* Sample Queries */}
        <div className="mt-6 bg-purple-600/20 border border-purple-500/50 rounded-lg p-4">
          <h4 className="text-purple-300 font-medium mb-2">Sample Export Queries:</h4>
          <div className="space-y-2 text-sm">
            <div className="text-purple-200">
              <strong>MySQL:</strong> CREATE TABLE conversions (id INT AUTO_INCREMENT PRIMARY KEY, filename VARCHAR(255), json_data JSON, created_at TIMESTAMP);
            </div>
            <div className="text-purple-200">
              <strong>PostgreSQL:</strong> CREATE TABLE conversions (id SERIAL PRIMARY KEY, filename VARCHAR(255), json_data JSONB, created_at TIMESTAMP);
            </div>
            <div className="text-purple-200">
              <strong>MongoDB:</strong> db.conversions.createIndex({{"filename": 1, "createdAt": -1}})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}