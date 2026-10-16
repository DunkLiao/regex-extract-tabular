self.onmessage = ({ data }) => {
  const { id, text, pattern, flags, options } = data;
  const started = performance.now();
  try {
    const regex = new RegExp(pattern, flags.includes('g') ? flags : `${flags}g`);
    const descriptors = getCaptureDescriptors(pattern);
    const columns = descriptors.length
      ? descriptors.map((item, i) => ({ key: item.key, title: item.title, isNamed: item.isNamed, index: item.index ?? i + 1 }))
      : [{ key: 'full_match', title: 'Full Match ($0)', isNamed: false, index: 0 }];
    const rows = [];
    let match;
    let count = 0;
    let capped = false;
    while ((match = regex.exec(text)) !== null) {
      count += 1;
      if (count > 50000) { capped = true; break; }
      const row = { __rowId: `row_${count}`, __fullMatch: normalize(match[0], options) };
      if (descriptors.length) {
        for (const descriptor of descriptors) {
          let value = descriptor.isNamed ? match.groups?.[descriptor.groupName] : match[descriptor.captureIndex];
          row[descriptor.key] = value === undefined ? options.placeholder : normalize(value, options);
        }
      } else row.full_match = normalize(match[0], options);
      if (options.ignoreEmptyMatches && descriptors.length && descriptors.every((descriptor) => {
        const value = descriptor.isNamed ? match.groups?.[descriptor.groupName] : match[descriptor.captureIndex];
        return value === undefined || normalize(value, options) === '';
      })) {
        if (match[0] === '') advance(regex, match, text);
        continue;
      }
      rows.push(row);
      if (match[0] === '') advance(regex, match, text);
    }
    self.postMessage({ id, result: { isValid: true, executionTimeMs: performance.now() - started, columns, rows, totalMatches: rows.length, capped } });
  } catch (error) {
    self.postMessage({ id, result: { isValid: false, errorMessage: error instanceof SyntaxError ? `正則語法錯誤：${error.message}` : `解析失敗：${error.message}`, executionTimeMs: performance.now() - started, columns: [], rows: [], totalMatches: 0 } });
  }
};

function normalize(value, options) {
  const trimmed = options.trimWhitespace ? value.trim() : value;
  return trimmed === '' && options.placeholder !== '' ? options.placeholder : trimmed;
}
function advance(regex, match, text) {
  if (regex.lastIndex <= match.index) regex.lastIndex = match.index + (text.codePointAt(match.index) > 0xffff ? 2 : 1);
}
function getCaptureDescriptors(source) {
  const captures = [];
  let index = 0, inClass = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '\\') { i++; continue; }
    if (char === '[' && !inClass) { inClass = true; continue; }
    if (char === ']' && inClass) { inClass = false; continue; }
    if (char !== '(' || inClass) continue;
    if (source[i + 1] !== '?') {
      index++;
      captures.push({ captureIndex: index, key: `capture_${index}`, title: `Group ${index}`, isNamed: false, index });
      continue;
    }
    if (source[i + 2] === '<' && source[i + 3] !== '=' && source[i + 3] !== '!') {
      const end = source.indexOf('>', i + 3);
      if (end !== -1) {
        index++;
        const name = source.slice(i + 3, end);
        captures.push({ captureIndex: index, groupName: name, key: `capture_${index}`, title: name, isNamed: true, index });
      }
    }
  }
  // Use collision-safe keys while keeping unnamed column titles sequential.
  let unnamed = 0;
  for (const capture of captures) if (!capture.isNamed) { unnamed++; capture.title = `Group ${unnamed}`; }
  return captures;
}
