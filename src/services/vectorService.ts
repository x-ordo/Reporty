/**
 * Vector Embedding & Similarity Search Service
 *
 * Uses OpenAI text-embedding-3-small for embeddings
 * and cosine similarity for search.
 */

import OpenAI from 'openai';
import { CaseLaw, SAMPLE_CASE_LAWS } from '../data/caseLaw';

let _client: OpenAI | null = null;

const getClient = (): OpenAI => {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    _client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }
  return _client;
};

// Storage keys
const EMBEDDINGS_CACHE_KEY = 'safereport_case_embeddings';

interface EmbeddingCache {
  version: string;
  embeddings: Record<string, number[]>;
  lastUpdated: string;
}

/**
 * Get cached embeddings from localStorage
 */
function getCachedEmbeddings(): EmbeddingCache | null {
  try {
    const cached = localStorage.getItem(EMBEDDINGS_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

/**
 * Save embeddings to localStorage
 */
function saveEmbeddings(cache: EmbeddingCache): void {
  try {
    localStorage.setItem(EMBEDDINGS_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Failed to cache embeddings:', e);
  }
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getClient();

  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Initialize case law embeddings (lazy load)
 */
export async function initializeCaseLawEmbeddings(
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const cache = getCachedEmbeddings();
  const currentVersion = 'v1.0';

  // Check if we have valid cache
  if (cache && cache.version === currentVersion) {
    const allCached = SAMPLE_CASE_LAWS.every(c => cache.embeddings[c.id]);
    if (allCached) {
      console.log('Using cached case law embeddings');
      return;
    }
  }

  console.log('Generating case law embeddings...');
  const embeddings: Record<string, number[]> = cache?.embeddings || {};

  for (let i = 0; i < SAMPLE_CASE_LAWS.length; i++) {
    const caseLaw = SAMPLE_CASE_LAWS[i];

    if (!embeddings[caseLaw.id]) {
      // Create embedding from title + summary + keywords
      const textToEmbed = `${caseLaw.title} ${caseLaw.summary} ${caseLaw.keywords.join(' ')}`;
      embeddings[caseLaw.id] = await generateEmbedding(textToEmbed);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    onProgress?.(i + 1, SAMPLE_CASE_LAWS.length);
  }

  saveEmbeddings({
    version: currentVersion,
    embeddings,
    lastUpdated: new Date().toISOString(),
  });

  console.log('Case law embeddings initialized');
}

export interface SimilarCase {
  caseLaw: CaseLaw;
  similarity: number;
}

/**
 * Search for similar cases based on query text
 */
export async function searchSimilarCases(
  query: string,
  limit: number = 5,
  minSimilarity: number = 0.3
): Promise<SimilarCase[]> {
  // Ensure embeddings are initialized
  await initializeCaseLawEmbeddings();

  const cache = getCachedEmbeddings();
  if (!cache) {
    throw new Error('Embeddings not initialized');
  }

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // Calculate similarities
  const results: SimilarCase[] = [];

  for (const caseLaw of SAMPLE_CASE_LAWS) {
    const caseEmbedding = cache.embeddings[caseLaw.id];
    if (!caseEmbedding) continue;

    const similarity = cosineSimilarity(queryEmbedding, caseEmbedding);

    if (similarity >= minSimilarity) {
      results.push({ caseLaw, similarity });
    }
  }

  // Sort by similarity (descending) and limit
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Get case by category with highest relevance
 */
export async function searchByCategory(
  query: string,
  category: string,
  limit: number = 3
): Promise<SimilarCase[]> {
  const allResults = await searchSimilarCases(query, 10, 0.2);

  return allResults
    .filter(r => r.caseLaw.category === category)
    .slice(0, limit);
}

/**
 * Quick keyword-based search (no API call)
 */
export function quickKeywordSearch(
  keywords: string[],
  limit: number = 5
): CaseLaw[] {
  const results: { caseLaw: CaseLaw; score: number }[] = [];

  for (const caseLaw of SAMPLE_CASE_LAWS) {
    let score = 0;

    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase();

      // Check in keywords
      if (caseLaw.keywords.some(k => k.includes(lowerKeyword))) {
        score += 3;
      }

      // Check in title
      if (caseLaw.title.toLowerCase().includes(lowerKeyword)) {
        score += 2;
      }

      // Check in summary
      if (caseLaw.summary.toLowerCase().includes(lowerKeyword)) {
        score += 1;
      }
    }

    if (score > 0) {
      results.push({ caseLaw, score });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(r => r.caseLaw);
}

/**
 * Extract keywords from report text (simple implementation)
 */
export function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    '이', '가', '은', '는', '을', '를', '에', '에서', '와', '과', '의', '로', '으로',
    '하다', '되다', '있다', '없다', '하고', '그', '저', '이런', '그런', '것',
    '수', '등', '및', '또는', '그리고', '때문에', '위해', '대해',
  ]);

  // Extract Korean words (2+ characters)
  const words = text.match(/[가-힣]{2,}/g) || [];

  // Count frequency
  const freq: Record<string, number> = {};
  for (const word of words) {
    if (!stopWords.has(word)) {
      freq[word] = (freq[word] || 0) + 1;
    }
  }

  // Sort by frequency and return top keywords
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}
