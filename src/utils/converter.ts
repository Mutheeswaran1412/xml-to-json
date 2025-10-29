import { parseAlteryxWorkflow } from './workflowConverter';

// Cache for conversion results
const conversionCache = new Map<string, { result: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function validateXmlSyntax(xmlString: string): Array<{line: number, message: string}> {
  const errors: Array<{line: number, message: string}> = [];
  
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      const errorText = parserError.textContent || '';
      const lineMatch = errorText.match(/line (\d+)/i);
      const line = lineMatch ? parseInt(lineMatch[1]) : 1;
      
      errors.push({
        line,
        message: errorText.replace(/^.*?error:\s*/i, '').trim()
      });
    }
    
    // Additional validation checks
    const lines = xmlString.split('\n');
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('<?') && !trimmed.startsWith('<!--')) {
        // Check for unclosed tags
        const openTags = (trimmed.match(/<[^/][^>]*[^/]>/g) || []).length;
        const closeTags = (trimmed.match(/<\/[^>]+>/g) || []).length;
        const selfClosing = (trimmed.match(/<[^>]*\/>/g) || []).length;
        
        if (openTags > closeTags + selfClosing && trimmed.includes('<')) {
          errors.push({
            line: index + 1,
            message: 'Possible unclosed tag detected'
          });
        }
      }
    });
  } catch (error) {
    errors.push({
      line: 1,
      message: 'Invalid XML structure'
    });
  }
  
  return errors;
}

export function processNamespaces(xmlString: string): string {
  // Handle XML namespaces by preserving them in the conversion
  return xmlString.replace(/xmlns:([^=]+)="[^"]*"/g, (match, prefix) => {
    return match; // Keep namespace declarations
  });
}

export function processCDATA(xmlString: string): string {
  // Handle CDATA sections properly
  return xmlString.replace(/<!\[CDATA\[(.*?)\]\]>/gs, (match, content) => {
    return content; // Extract CDATA content
  });
}

export async function convertXmlToJson(
  xmlString: string,
  options?: { 
    preserveAttributes?: boolean;
    outputFormat?: 'pretty' | 'minified' | 'compact';
    useCache?: boolean;
  }
): Promise<string> {
  try {
    const trimmedXml = xmlString.trim();

    if (!trimmedXml) {
      throw new Error('XML content is empty');
    }

    if (!trimmedXml.startsWith('<')) {
      throw new Error('Invalid XML: Content must start with a tag');
    }

    // Check cache first
    const useCache = options?.useCache ?? true;
    if (useCache) {
      const cacheKey = `${trimmedXml}_${JSON.stringify(options)}`;
      const cached = conversionCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.result;
      }
    }

    // Process namespaces and CDATA
    const processedXml = processCDATA(processNamespaces(trimmedXml));

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(processedXml, 'text/xml');

    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid XML: ' + parserError.textContent);
    }

    let result: string;

    // Check if this is an Alteryx workflow and use specialized parser
    const fileType = detectFileType(processedXml);
    if (fileType === 'yxmd') {
      const alteryxWorkflow = parseAlteryxWorkflow(processedXml);
      result = formatJsonOutput(alteryxWorkflow, options?.outputFormat);
    } else {
      // Use generic XML parser for other files
      const jsonObj = xmlToJson(xmlDoc.documentElement, options?.preserveAttributes ?? true);
      result = formatJsonOutput(jsonObj, options?.outputFormat);
    }

    // Cache the result
    if (useCache) {
      const cacheKey = `${trimmedXml}_${JSON.stringify(options)}`;
      conversionCache.set(cacheKey, { result, timestamp: Date.now() });
      
      // Clean old cache entries
      cleanCache();
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred during conversion');
  }
}

function formatJsonOutput(jsonObj: any, format?: 'pretty' | 'minified' | 'compact'): string {
  switch (format) {
    case 'minified':
      return JSON.stringify(jsonObj);
    case 'compact':
      return JSON.stringify(jsonObj, null, 1);
    default:
      return JSON.stringify(jsonObj, null, 2);
  }
}

function cleanCache() {
  const now = Date.now();
  for (const [key, value] of conversionCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      conversionCache.delete(key);
    }
  }
}

export function clearConversionCache() {
  conversionCache.clear();
}
}

export function detectFileType(xmlString: string): 'yxmd' | 'generic' {
  // Enhanced detection with multiple checks
  const alteryxIndicators = [
    'AlteryxDocument',
    '<Node ToolID=',
    '<Connection Origin=',
    'GuiSettings Plugin=',
    'yxmdVer=',
    'EngineSettings EngineDll='
  ];
  
  const hasAlteryxIndicators = alteryxIndicators.some(indicator => 
    xmlString.includes(indicator)
  );
  
  return hasAlteryxIndicators ? 'yxmd' : 'generic';
}

function xmlToJson(xml: Element | Document, preserveAttributes = true): any {
  let obj: any = {};

  if (xml instanceof Document) {
    return xmlToJson(xml.documentElement, preserveAttributes);
  }

  if (xml.nodeType === 1) {
    if (preserveAttributes && xml.attributes.length > 0) {
      obj['@attributes'] = {};
      for (let j = 0; j < xml.attributes.length; j++) {
        const attribute = xml.attributes.item(j);
        if (attribute) {
          obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
        }
      }
    }
  } else if (xml.nodeType === 3) {
    obj = xml.nodeValue;
  }

  const textNodes = Array.from(xml.childNodes).filter(
    node => node.nodeType === 3
  );

  if (xml.hasChildNodes() && xml.childNodes.length === textNodes.length) {
    const text = Array.from(xml.childNodes)
      .map(node => node.nodeValue)
      .join('')
      .trim();

    if (text) {
      if (Object.keys(obj).length === 0) {
        return text;
      }
      obj['#text'] = text;
    }
  } else if (xml.hasChildNodes()) {
    for (let i = 0; i < xml.childNodes.length; i++) {
      const item = xml.childNodes.item(i);
      const nodeName = item.nodeName;

      if (item.nodeType === 3) {
        const text = item.nodeValue?.trim();
        if (text && Object.keys(obj).length === 0) {
          return text;
        }
        continue;
      }

      if (typeof obj[nodeName] === 'undefined') {
        obj[nodeName] = xmlToJson(item as Element, preserveAttributes);
      } else {
        if (typeof obj[nodeName].push === 'undefined') {
          const old = obj[nodeName];
          obj[nodeName] = [];
          obj[nodeName].push(old);
        }
        obj[nodeName].push(xmlToJson(item as Element, preserveAttributes));
      }
    }
  }

  return obj;
}
