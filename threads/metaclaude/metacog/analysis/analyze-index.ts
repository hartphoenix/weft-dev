import fs from 'fs';
import path from 'path';

interface Chunk {
  id: string;
  text: string;
  source: string;
  metadata?: Record<string, any>;
}

interface IndexData {
  chunks: Chunk[];
  metadata?: Record<string, any>;
}

const indexPath = path.join(process.env.HOME || '/Users/rhhart', '.claude/metaclaude/embedding-index/index.json');
const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as IndexData;
const chunks = indexData.chunks || [];

console.log(`\n=== EMBEDDING INDEX ANALYSIS ===\n`);
console.log(`Total chunks: ${chunks.length}`);

// 1. Analyze text lengths and distribution
const lengthStats = chunks.map((c) => ({
  id: c.id,
  source: c.source,
  length: c.text.length,
  text: c.text,
}));

lengthStats.sort((a, b) => b.length - a.length);

const minLength = Math.min(...lengthStats.map((s) => s.length));
const maxLength = Math.max(...lengthStats.map((s) => s.length));
const avgLength = Math.round(
  lengthStats.reduce((sum, s) => sum + s.length, 0) / lengthStats.length
);

console.log(`\n## LENGTH DISTRIBUTION`);
console.log(`Min: ${minLength} chars`);
console.log(`Max: ${maxLength} chars`);
console.log(`Avg: ${avgLength} chars`);
console.log(`Median: ${lengthStats[Math.floor(lengthStats.length / 2)].length} chars`);

// Distribution buckets
const buckets = [100, 200, 300, 400, 500, 600, 700, 800, 1000, 1500, 2000, 3000, 5000, 10000, 32000];
const bucketCounts: Record<string, number> = {};
for (const bucket of buckets) {
  bucketCounts[`<${bucket}`] = lengthStats.filter((s) => s.length < bucket).length;
}

console.log(`\nChunks by size bucket:`);
let prev = 0;
for (const bucket of buckets) {
  const count = bucketCounts[`<${bucket}`] - (prev > 0 ? bucketCounts[`<${prev}`] : 0);
  if (count > 0) {
    console.log(
      `  ${prev > 0 ? prev : '0'}-${bucket} chars: ${count} chunks (${((count / chunks.length) * 100).toFixed(1)}%)`
    );
  }
  prev = bucket;
}

// 2. Oversized chunks (>800 chars) - structure analysis
console.log(`\n## OVERSIZED CHUNKS (>800 chars)`);
const oversized = lengthStats.filter((s) => s.length > 800);
console.log(`Count: ${oversized.length} chunks (${((oversized.length / chunks.length) * 100).toFixed(1)}%)`);

const structureAnalysis = oversized.map((chunk) => {
  const text = chunk.text;
  const paragraphBreaks = (text.match(/\n\n/g) || []).length;
  const subHeadings = (text.match(/^###/gm) || []).length;
  const hasInternalBreaks = paragraphBreaks > 0;
  const isList = /^[-*]\s|^\d+\./m.test(text);

  // Find paragraph break positions
  const breaks: number[] = [];
  let index = 0;
  while ((index = text.indexOf('\n\n', index)) \!== -1) {
    breaks.push(index);
    index += 2;
  }

  return {
    ...chunk,
    paragraphBreaks,
    subHeadings,
    hasInternalBreaks,
    isList,
    firstBreakAt: breaks[0] ?? -1,
    secondBreakAt: breaks[1] ?? -1,
  };
});

// Group by chunking strategy (inferred from source path)
const byStrategy: Record<string, typeof structureAnalysis> = {};
for (const item of structureAnalysis) {
  let strategy = 'markdown-sections';

  if (item.source.includes('learning/current-state.md')) {
    strategy = 'yaml-concepts';
  } else if (item.source.includes('learning/arcs.md')) {
    strategy = 'yaml-arcs';
  } else if (item.source.includes('design/') || item.source.includes('research/')) {
    strategy = 'markdown-sections';
  }

  if (\!byStrategy[strategy]) {
    byStrategy[strategy] = [];
  }
  byStrategy[strategy].push(item);
}

console.log(`\nOversized chunks by strategy:`);
for (const [strategy, items] of Object.entries(byStrategy)) {
  const totalChars = items.reduce((sum, i) => sum + i.length, 0);
  const avgChars = Math.round(totalChars / items.length);
  const avgBreaks = (items.reduce((sum, i) => sum + i.paragraphBreaks, 0) / items.length).toFixed(1);
  const avgHeadings = (items.reduce((sum, i) => sum + i.subHeadings, 0) / items.length).toFixed(1);

  console.log(`\n  ${strategy}: ${items.length} chunks`);
  console.log(`    Avg size: ${avgChars} chars`);
  console.log(`    Avg paragraph breaks: ${avgBreaks}`);
  console.log(`    Avg sub-headings: ${avgHeadings}`);
  console.log(`    Has internal structure: ${items.filter((i) => i.hasInternalBreaks || i.isList).length}/${items.length}`);
}

// 3. Top 10 largest chunks - detailed inspection
console.log(`\n## TOP 10 LARGEST CHUNKS\n`);
const top10 = lengthStats.slice(0, 10);

for (let i = 0; i < top10.length; i++) {
  const chunk = top10[i];
  const enriched = structureAnalysis.find((s) => s.id === chunk.id)\!;

  console.log(`${i + 1}. Size: ${chunk.length} chars | Source: ${chunk.source}`);
  console.log(`   First 200 chars: ${chunk.text.substring(0, 200).replace(/\n/g, '\\n')}...`);
  console.log(`   Structure: ${enriched.paragraphBreaks} paragraph breaks, ${enriched.subHeadings} sub-headings`);
  console.log(`   1st break at: ${enriched.firstBreakAt} chars | 2nd break at: ${enriched.secondBreakAt} chars`);
  console.log('');
}

// 4. Token limit analysis (nomic-embed-text: 8192 tokens, ~4:1 ratio = ~32K chars)
console.log(`\n## TOKEN CAPACITY ANALYSIS`);
const TOKEN_LIMIT = 8192;
const CHARS_PER_TOKEN = 4; // approximate
const CHARS_LIMIT = TOKEN_LIMIT * CHARS_PER_TOKEN;

console.log(`nomic-embed-text capacity: ${TOKEN_LIMIT} tokens (~${CHARS_LIMIT} chars)`);
console.log(`Chunks at risk (>80% capacity): ${lengthStats.filter((s) => s.length > CHARS_LIMIT * 0.8).length} chunks`);
console.log(`Chunks exceeding capacity: ${lengthStats.filter((s) => s.length > CHARS_LIMIT).length} chunks`);

const atRisk = lengthStats.filter((s) => s.length > CHARS_LIMIT * 0.8);
if (atRisk.length > 0) {
  console.log(`\nChunks at 80%+ capacity:`);
  for (const chunk of atRisk.slice(0, 5)) {
    const percentOfLimit = ((chunk.length / CHARS_LIMIT) * 100).toFixed(1);
    console.log(`  ${chunk.length} chars (${percentOfLimit}% of ${CHARS_LIMIT}) - ${chunk.source}`);
  }
}

// 5. Paragraph-based splitting opportunity
console.log(`\n## PARAGRAPH-BASED SPLITTING OPPORTUNITY`);
const splitOpportunities = structureAnalysis
  .filter((s) => s.length > 800 && s.firstBreakAt > 300)
  .sort((a, b) => b.length - a.length);

if (splitOpportunities.length > 0) {
  console.log(`Chunks where paragraph-based split would help (>800 chars, first break after 300+ chars):`);
  for (const chunk of splitOpportunities.slice(0, 8)) {
    console.log(`  ${chunk.length} chars - first break at ${chunk.firstBreakAt}`);
    console.log(`    Would split into: [0-${chunk.firstBreakAt}] + [${chunk.firstBreakAt + 2}-...]`);
  }
}
