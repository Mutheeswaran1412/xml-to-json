export async function convertXmlToJson(
  xmlString: string,
  options?: { preserveAttributes?: boolean }
): Promise<string> {
  try {
    const trimmedXml = xmlString.trim();

    if (!trimmedXml) {
      throw new Error('XML content is empty');
    }

    if (!trimmedXml.startsWith('<')) {
      throw new Error('Invalid XML: Content must start with a tag');
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(trimmedXml, 'text/xml');

    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid XML: ' + parserError.textContent);
    }

    const jsonObj = xmlToJson(xmlDoc.documentElement, options?.preserveAttributes ?? true);

    return JSON.stringify(jsonObj, null, 2);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred during conversion');
  }
}

export function detectFileType(xmlString: string): 'yxmd' | 'generic' {
  if (xmlString.includes('AlteryxDocument') || xmlString.includes('Properties')) {
    return 'yxmd';
  }
  return 'generic';
}

function xmlToJson(xml: Element | Document, preserveAttributes = true): any {
  let obj: any = {};

  if (xml instanceof Document) {
    return xmlToJson(xml.documentElement);
  }

  if (xml.nodeType === 1) {
    if (xml.attributes.length > 0) {
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
        obj[nodeName] = xmlToJson(item as Element);
      } else {
        if (typeof obj[nodeName].push === 'undefined') {
          const old = obj[nodeName];
          obj[nodeName] = [];
          obj[nodeName].push(old);
        }
        obj[nodeName].push(xmlToJson(item as Element));
      }
    }
  }

  return obj;
}
