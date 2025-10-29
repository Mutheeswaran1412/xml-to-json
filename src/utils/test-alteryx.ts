// Test file for Alteryx workflow parsing
import { parseAlteryxWorkflow } from './workflowConverter';
import { detectFileType } from './converter';

// Sample Alteryx XML for testing
const sampleAlteryxXml = `<?xml version="1.0"?>
<AlteryxDocument yxmdVer="2023.1">
  <Nodes>
    <Node ToolID="1">
      <GuiSettings Plugin="AlteryxBasePluginsGui.DbFileInput.DbFileInput" X="54" Y="162" />
      <Properties>
        <Configuration>
          <File>input.csv</File>
        </Configuration>
      </Properties>
      <EngineSettings EngineDll="AlteryxBasePluginsEngine.dll" />
    </Node>
    <Node ToolID="2">
      <GuiSettings Plugin="AlteryxBasePluginsGui.AlteryxSelect.AlteryxSelect" X="186" Y="162" />
      <Properties>
        <Configuration>
          <SelectFields>
            <SelectField field="ID" selected="True" />
          </SelectFields>
        </Configuration>
      </Properties>
    </Node>
  </Nodes>
  <Connections>
    <Connection>
      <Origin ToolID="1" Connection="Output" />
      <Destination ToolID="2" Connection="Input" />
    </Connection>
  </Connections>
  <Properties>
    <MetaInfo>
      <Name>Test Workflow</Name>
      <Author>Trinity Tech</Author>
      <Description>Test workflow for parsing</Description>
    </MetaInfo>
  </Properties>
</AlteryxDocument>`;

// Test functions
export function testAlteryxDetection(): boolean {
  return detectFileType(sampleAlteryxXml) === 'yxmd';
}

export function testAlteryxParsing(): any {
  return parseAlteryxWorkflow(sampleAlteryxXml);
}

// Console test (for development)
if (typeof window === 'undefined') {
  console.log('Testing Alteryx detection:', testAlteryxDetection());
  console.log('Testing Alteryx parsing:', JSON.stringify(testAlteryxParsing(), null, 2));
}