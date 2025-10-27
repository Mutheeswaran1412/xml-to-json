export interface WorkflowStep {
  id: string;
  name: string;
  type: 'input' | 'transform' | 'process' | 'output';
  description: string;
  inputData: string;
  outputData: string;
}

export interface CloudWorkflow {
  version: string;
  name: string;
  steps: WorkflowStep[];
  connections: Array<{
    from: string;
    to: string;
  }>;
}

export function convertYxmdToJson(csvData: string): CloudWorkflow {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',');
  
  const steps: WorkflowStep[] = lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      id: values[0],
      name: values[1],
      type: values[2] as WorkflowStep['type'],
      description: values[3],
      inputData: values[4],
      outputData: values[5]
    };
  });

  const connections = steps.slice(0, -1).map((step, index) => ({
    from: step.id,
    to: steps[index + 1].id
  }));

  return {
    version: '1.0',
    name: 'Converted Workflow',
    steps,
    connections
  };
}