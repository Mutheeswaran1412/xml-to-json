export interface AlteryxTool {
  id: string;
  name: string;
  type: string;
  plugin: string;
  version?: string;
  position?: { x: number; y: number };
  configuration: Record<string, any>;
  engineSettings?: Record<string, any>;
}

export interface AlteryxConnection {
  origin: string;
  destination: string;
  originOutput?: string;
  destinationInput?: string;
}

export interface AlteryxWorkflow {
  metadata: {
    version?: string;
    author?: string;
    description?: string;
    created?: string;
    modified?: string;
    category?: string;
  };
  tools: AlteryxTool[];
  connections: AlteryxConnection[];
  properties: Record<string, any>;
  constants?: Record<string, any>;
}

export function parseAlteryxWorkflow(xmlString: string): AlteryxWorkflow {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  
  const workflow: AlteryxWorkflow = {
    metadata: {},
    tools: [],
    connections: [],
    properties: {}
  };

  // Extract metadata
  const metaInfo = xmlDoc.querySelector('MetaInfo');
  if (metaInfo) {
    workflow.metadata.author = metaInfo.querySelector('Author')?.textContent || undefined;
    workflow.metadata.description = metaInfo.querySelector('Description')?.textContent || undefined;
    workflow.metadata.created = metaInfo.querySelector('Created')?.textContent || undefined;
    workflow.metadata.modified = metaInfo.querySelector('Modified')?.textContent || undefined;
    workflow.metadata.category = metaInfo.querySelector('CategoryName')?.textContent || undefined;
  }

  // Extract tools
  const nodes = xmlDoc.querySelectorAll('Node');
  nodes.forEach(node => {
    const tool: AlteryxTool = {
      id: node.getAttribute('ToolID') || '',
      name: node.querySelector('GuiSettings')?.getAttribute('Plugin') || 'Unknown',
      type: node.querySelector('GuiSettings')?.getAttribute('Plugin') || 'Unknown',
      plugin: node.querySelector('GuiSettings')?.getAttribute('Plugin') || '',
      configuration: {},
      position: {
        x: parseInt(node.querySelector('GuiSettings')?.getAttribute('X') || '0'),
        y: parseInt(node.querySelector('GuiSettings')?.getAttribute('Y') || '0')
      }
    };

    // Extract tool configuration
    const properties = node.querySelector('Properties');
    if (properties) {
      const config: Record<string, any> = {};
      Array.from(properties.children).forEach(child => {
        config[child.tagName] = child.textContent || child.innerHTML;
      });
      tool.configuration = config;
    }

    // Extract engine settings
    const engineSettings = node.querySelector('EngineSettings');
    if (engineSettings) {
      const settings: Record<string, any> = {};
      Array.from(engineSettings.attributes).forEach(attr => {
        settings[attr.name] = attr.value;
      });
      tool.engineSettings = settings;
    }

    workflow.tools.push(tool);
  });

  // Extract connections
  const connections = xmlDoc.querySelectorAll('Connection');
  connections.forEach(conn => {
    const connection: AlteryxConnection = {
      origin: conn.getAttribute('Origin') || '',
      destination: conn.getAttribute('Destination') || ''
    };
    
    const originOutput = conn.getAttribute('OriginOutput');
    const destinationInput = conn.getAttribute('DestinationInput');
    
    if (originOutput) connection.originOutput = originOutput;
    if (destinationInput) connection.destinationInput = destinationInput;
    
    workflow.connections.push(connection);
  });

  // Extract workflow properties
  const workflowProps = xmlDoc.querySelector('Properties');
  if (workflowProps) {
    Array.from(workflowProps.children).forEach(child => {
      workflow.properties[child.tagName] = child.textContent || child.innerHTML;
    });
  }

  // Extract constants
  const constants = xmlDoc.querySelectorAll('Constant');
  if (constants.length > 0) {
    workflow.constants = {};
    constants.forEach(constant => {
      const name = constant.getAttribute('Name');
      const value = constant.textContent;
      if (name) workflow.constants![name] = value;
    });
  }

  return workflow;
}