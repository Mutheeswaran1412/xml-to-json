import { useState } from 'react';
import { Webhook, MessageSquare, Zap, Github, Play, Settings, CheckCircle2 } from 'lucide-react';

interface Integration {
  name: string;
  icon: any;
  description: string;
  configured: boolean;
  webhookUrl?: string;
  apiKey?: string;
}

export function Integrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      name: 'Slack',
      icon: MessageSquare,
      description: 'Send conversion notifications to Slack channels',
      configured: false
    },
    {
      name: 'Microsoft Teams',
      icon: MessageSquare,
      description: 'Post updates to Teams channels',
      configured: false
    },
    {
      name: 'Zapier',
      icon: Zap,
      description: 'Connect with 3000+ apps via Zapier',
      configured: false
    },
    {
      name: 'GitHub Actions',
      icon: Github,
      description: 'Trigger CI/CD workflows on conversion',
      configured: false
    }
  ]);

  const [selectedIntegration, setSelectedIntegration] = useState<string>('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [testMessage, setTestMessage] = useState('');

  const configureIntegration = (name: string) => {
    if (!webhookUrl && name !== 'Zapier') {
      alert('Please enter webhook URL');
      return;
    }

    setIntegrations(prev => prev.map(integration =>
      integration.name === name
        ? { ...integration, configured: true, webhookUrl, apiKey }
        : integration
    ));

    setWebhookUrl('');
    setApiKey('');
    setSelectedIntegration('');
    alert(`${name} integration configured successfully!`);
  };

  const testIntegration = async (name: string) => {
    const integration = integrations.find(i => i.name === name);
    if (!integration?.configured) {
      alert('Please configure the integration first');
      return;
    }

    try {
      // Simulate webhook call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const message = testMessage || `Test message from XML to JSON Converter - ${new Date().toLocaleString()}`;
      
      // Simulate different integration responses
      const responses = {
        'Slack': `Message sent to Slack: "${message}"`,
        'Microsoft Teams': `Message posted to Teams: "${message}"`,
        'Zapier': `Zapier webhook triggered with payload: ${JSON.stringify({event: 'test', message})}`,
        'GitHub Actions': `GitHub workflow triggered: xml-converter-test`
      };

      alert(responses[name as keyof typeof responses]);
      setTestMessage('');
    } catch (error) {
      alert('Integration test failed. Please check your configuration.');
    }
  };

  const triggerWebhook = async (event: string, data: any) => {
    const configuredIntegrations = integrations.filter(i => i.configured);
    
    for (const integration of configuredIntegrations) {
      try {
        // Simulate webhook call
        console.log(`Sending to ${integration.name}:`, { event, data });
        
        // In real implementation, you would make actual HTTP requests here
        // await fetch(integration.webhookUrl, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ event, data, timestamp: new Date().toISOString() })
        // });
      } catch (error) {
        console.error(`Failed to send webhook to ${integration.name}:`, error);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Webhook className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-semibold text-white">Integrations & Webhooks</h2>
        </div>

        {/* Integration Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {integrations.map((integration) => {
            const IconComponent = integration.icon;
            return (
              <div key={integration.name} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-6 h-6 text-blue-400" />
                    <div>
                      <h3 className="text-white font-medium">{integration.name}</h3>
                      <p className="text-gray-400 text-sm">{integration.description}</p>
                    </div>
                  </div>
                  {integration.configured && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedIntegration(integration.name)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                  >
                    <Settings className="w-4 h-4" />
                    {integration.configured ? 'Reconfigure' : 'Configure'}
                  </button>
                  
                  {integration.configured && (
                    <button
                      onClick={() => testIntegration(integration.name)}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                    >
                      <Play className="w-4 h-4" />
                      Test
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Configuration Form */}
        {selectedIntegration && (
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h3 className="text-white font-medium mb-4">Configure {selectedIntegration}</h3>
            
            <div className="space-y-4">
              {selectedIntegration !== 'Zapier' && (
                <div>
                  <label className="block text-gray-300 mb-2">Webhook URL</label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder={`https://hooks.${selectedIntegration.toLowerCase()}.com/...`}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              )}
              
              {(selectedIntegration === 'Zapier' || selectedIntegration === 'GitHub Actions') && (
                <div>
                  <label className="block text-gray-300 mb-2">
                    {selectedIntegration === 'Zapier' ? 'Zapier Webhook URL' : 'GitHub Token'}
                  </label>
                  <input
                    type={selectedIntegration === 'GitHub Actions' ? 'password' : 'url'}
                    value={selectedIntegration === 'Zapier' ? webhookUrl : apiKey}
                    onChange={(e) => selectedIntegration === 'Zapier' ? setWebhookUrl(e.target.value) : setApiKey(e.target.value)}
                    placeholder={selectedIntegration === 'Zapier' ? 'https://hooks.zapier.com/...' : 'ghp_...'}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={() => configureIntegration(selectedIntegration)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Save Configuration
                </button>
                <button
                  onClick={() => setSelectedIntegration('')}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Test Webhook */}
        <div className="bg-green-600/20 border border-green-500/50 rounded-lg p-4">
          <h4 className="text-green-300 font-medium mb-3">Test Webhook</h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter test message..."
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
            <button
              onClick={() => triggerWebhook('test', { message: testMessage })}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
            >
              Send Test
            </button>
          </div>
        </div>

        {/* Webhook Events */}
        <div className="mt-6 bg-blue-600/20 border border-blue-500/50 rounded-lg p-4">
          <h4 className="text-blue-300 font-medium mb-2">Available Webhook Events:</h4>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• <strong>conversion.completed</strong> - When XML conversion finishes successfully</li>
            <li>• <strong>conversion.failed</strong> - When XML conversion encounters an error</li>
            <li>• <strong>bulk.started</strong> - When bulk conversion process begins</li>
            <li>• <strong>bulk.completed</strong> - When bulk conversion process finishes</li>
            <li>• <strong>user.registered</strong> - When new user creates an account</li>
          </ul>
        </div>
      </div>
    </div>
  );
}