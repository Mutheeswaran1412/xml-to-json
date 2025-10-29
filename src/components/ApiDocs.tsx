import { useState } from 'react';
import { Code, Copy, Play, Key } from 'lucide-react';

export function ApiDocs() {
  const [apiKey, setApiKey] = useState('');
  const [testXml, setTestXml] = useState('<root><item>test</item></root>');
  const [response, setResponse] = useState('');

  const generateApiKey = () => {
    const key = 'xmlconv_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setApiKey(key);
  };

  const testApi = async () => {
    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          xml: testXml,
          options: {
            preserveAttributes: true,
            outputFormat: 'pretty'
          }
        })
      });
      
      const result = await response.json();
      setResponse(JSON.stringify(result, null, 2));
    } catch (error) {
      setResponse('API not available in demo mode');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Code className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">REST API Documentation</h2>
        </div>
        
        <div className="space-y-6">
          {/* API Key Section */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Authentication</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Your API Key"
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
              <button
                onClick={generateApiKey}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                <Key className="w-4 h-4" />
                Generate
              </button>
            </div>
            <p className="text-gray-400 text-sm">Include your API key in the Authorization header: Bearer YOUR_API_KEY</p>
          </div>

          {/* Endpoints */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Endpoints</h3>
            
            <div className="space-y-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">POST</span>
                    <code className="text-blue-300">/api/convert</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard('POST /api/convert')}
                    className="text-gray-400 hover:text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-gray-300 mb-3">Convert XML to JSON</p>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-white font-medium mb-2">Request Body:</h4>
                    <pre className="bg-black/30 rounded p-3 text-sm text-gray-300 overflow-x-auto">
{`{
  "xml": "<root><item>value</item></root>",
  "options": {
    "preserveAttributes": true,
    "outputFormat": "pretty"
  }
}`}
                    </pre>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-medium mb-2">Response:</h4>
                    <pre className="bg-black/30 rounded p-3 text-sm text-gray-300 overflow-x-auto">
{`{
  "success": true,
  "data": {
    "root": {
      "item": "value"
    }
  },
  "metadata": {
    "conversionTime": 15,
    "fileType": "generic"
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">GET</span>
                    <code className="text-blue-300">/api/history</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard('GET /api/history')}
                    className="text-gray-400 hover:text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-gray-300">Get conversion history</p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded">POST</span>
                    <code className="text-blue-300">/api/batch</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard('POST /api/batch')}
                    className="text-gray-400 hover:text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-gray-300">Batch convert multiple XML files</p>
              </div>
            </div>
          </div>

          {/* API Tester */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">API Tester</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-gray-300 mb-2">Test XML:</label>
                <textarea
                  value={testXml}
                  onChange={(e) => setTestXml(e.target.value)}
                  className="w-full h-24 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm"
                />
              </div>
              
              <button
                onClick={testApi}
                disabled={!apiKey}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg"
              >
                <Play className="w-4 h-4" />
                Test API
              </button>
              
              {response && (
                <div>
                  <label className="block text-gray-300 mb-2">Response:</label>
                  <pre className="bg-black/30 rounded p-3 text-sm text-gray-300 overflow-x-auto max-h-48">
                    {response}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Code Examples */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Code Examples</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-white font-medium mb-2">JavaScript/Node.js:</h4>
                <pre className="bg-black/30 rounded p-3 text-sm text-gray-300 overflow-x-auto">
{`const response = await fetch('/api/convert', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    xml: '<root><item>value</item></root>',
    options: { preserveAttributes: true }
  })
});

const result = await response.json();
console.log(result.data);`}
                </pre>
              </div>

              <div>
                <h4 className="text-white font-medium mb-2">Python:</h4>
                <pre className="bg-black/30 rounded p-3 text-sm text-gray-300 overflow-x-auto">
{`import requests

response = requests.post('/api/convert', 
  headers={'Authorization': 'Bearer YOUR_API_KEY'},
  json={
    'xml': '<root><item>value</item></root>',
    'options': {'preserveAttributes': True}
  }
)

result = response.json()
print(result['data'])`}
                </pre>
              </div>

              <div>
                <h4 className="text-white font-medium mb-2">cURL:</h4>
                <pre className="bg-black/30 rounded p-3 text-sm text-gray-300 overflow-x-auto">
{`curl -X POST /api/convert \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "xml": "<root><item>value</item></root>",
    "options": {"preserveAttributes": true}
  }'`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}