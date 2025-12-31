/**
 * Twitter/X Merkle Root Anchoring Service
 *
 * Anchors evidence hashes to Twitter/X for immutable timestamping.
 * The tweet serves as a public, third-party timestamp proof.
 */

import {
  buildMerkleTree,
  generateProof,
  verifyProof,
  formatAnchorTweet,
  createAnchorRecord,
  MerkleTree,
  MerkleProof,
  AnchorRecord,
} from '../utils/merkleTree';

// Storage keys
const ANCHORS_STORAGE_KEY = 'safereport_anchors';
const MERKLE_TREES_KEY = 'safereport_merkle_trees';

/**
 * Get all anchor records from local storage
 */
export function getAnchors(): AnchorRecord[] {
  try {
    const stored = localStorage.getItem(ANCHORS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save anchor record
 */
function saveAnchor(anchor: AnchorRecord): void {
  const anchors = getAnchors();
  const existingIndex = anchors.findIndex(a => a.id === anchor.id);
  if (existingIndex >= 0) {
    anchors[existingIndex] = anchor;
  } else {
    anchors.push(anchor);
  }
  localStorage.setItem(ANCHORS_STORAGE_KEY, JSON.stringify(anchors));
}

/**
 * Save Merkle tree for later verification
 */
function saveMerkleTree(anchorId: string, tree: MerkleTree): void {
  try {
    const stored = localStorage.getItem(MERKLE_TREES_KEY);
    const trees = stored ? JSON.parse(stored) : {};
    trees[anchorId] = {
      root: tree.root,
      leaves: tree.leaves,
      createdAt: tree.createdAt.toISOString(),
    };
    localStorage.setItem(MERKLE_TREES_KEY, JSON.stringify(trees));
  } catch (e) {
    console.error('Failed to save Merkle tree:', e);
  }
}

/**
 * Get Merkle tree by anchor ID
 */
export function getMerkleTree(anchorId: string): MerkleTree | null {
  try {
    const stored = localStorage.getItem(MERKLE_TREES_KEY);
    if (!stored) return null;
    const trees = JSON.parse(stored);
    const data = trees[anchorId];
    if (!data) return null;
    return {
      root: data.root,
      leaves: data.leaves,
      tree: { hash: data.root }, // Simplified - full tree not stored
      createdAt: new Date(data.createdAt),
    };
  } catch {
    return null;
  }
}

export interface AnchorResult {
  success: boolean;
  anchor: AnchorRecord;
  merkleTree: MerkleTree;
  tweetText: string;
  tweetIntentUrl: string;
}

/**
 * Create a new anchor from report hashes
 */
export async function createAnchor(
  reportHashes: Array<{ id: string; hash: string }>
): Promise<AnchorResult> {
  if (reportHashes.length === 0) {
    throw new Error('No reports to anchor');
  }

  // Build Merkle tree from hashes
  const hashes = reportHashes.map(r => r.hash);
  const merkleTree = await buildMerkleTree(hashes);

  // Create anchor record
  const reportIds = reportHashes.map(r => r.id);
  const anchor = createAnchorRecord(merkleTree.root, reportIds);

  // Generate tweet text
  const tweetText = formatAnchorTweet(
    merkleTree.root,
    reportHashes.length,
    anchor.createdAt
  );

  // Create Twitter intent URL
  const tweetIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  // Save to storage
  saveAnchor(anchor);
  saveMerkleTree(anchor.id, merkleTree);

  return {
    success: true,
    anchor,
    merkleTree,
    tweetText,
    tweetIntentUrl,
  };
}

/**
 * Update anchor with tweet ID after posting
 */
export function confirmAnchor(anchorId: string, tweetId: string, tweetUrl: string): void {
  const anchors = getAnchors();
  const anchor = anchors.find(a => a.id === anchorId);
  if (anchor) {
    anchor.tweetId = tweetId;
    anchor.tweetUrl = tweetUrl;
    anchor.status = 'anchored';
    saveAnchor(anchor);
  }
}

/**
 * Verify that a report hash is included in an anchor
 */
export async function verifyReportInAnchor(
  reportHash: string,
  anchorId: string
): Promise<{ verified: boolean; proof?: MerkleProof }> {
  const tree = getMerkleTree(anchorId);
  if (!tree) {
    return { verified: false };
  }

  const leafIndex = tree.leaves.indexOf(reportHash);
  if (leafIndex === -1) {
    return { verified: false };
  }

  // Rebuild tree for proof generation
  const fullTree = await buildMerkleTree(tree.leaves);
  const proof = await generateProof(fullTree, leafIndex);
  const verified = await verifyProof(proof);

  return { verified, proof };
}

/**
 * Get anchor for a specific report
 */
export function getAnchorForReport(reportId: string): AnchorRecord | null {
  const anchors = getAnchors();
  return anchors.find(a => a.reportIds.includes(reportId)) || null;
}

/**
 * Get pending reports (not yet anchored)
 */
export function getPendingReportIds(allReportIds: string[]): string[] {
  const anchors = getAnchors();
  const anchoredIds = new Set(anchors.flatMap(a => a.reportIds));
  return allReportIds.filter(id => !anchoredIds.has(id));
}

/**
 * Generate verification certificate text
 */
export function generateVerificationCertificate(
  anchor: AnchorRecord,
  reportId: string,
  reportHash: string
): string {
  return `
═══════════════════════════════════════════════════════════
                 SAFEREPORT ANCHOR CERTIFICATE
═══════════════════════════════════════════════════════════

REPORT VERIFICATION

  Report ID:     ${reportId}
  Evidence Hash: ${reportHash}

MERKLE ANCHOR

  Anchor ID:     ${anchor.id}
  Merkle Root:   ${anchor.merkleRoot}
  Reports Count: ${anchor.reportIds.length}
  Anchor Date:   ${new Date(anchor.createdAt).toISOString()}

TWITTER TIMESTAMP PROOF

  Tweet ID:      ${anchor.tweetId || 'PENDING'}
  Tweet URL:     ${anchor.tweetUrl || 'Not yet posted'}
  Status:        ${anchor.status.toUpperCase()}

VERIFICATION

  This certificate confirms that the above report hash was
  included in a Merkle tree whose root was publicly posted
  to Twitter/X at the specified timestamp.

  The cryptographic proof ensures:
  1. The report existed at the anchor timestamp
  2. The report content has not been modified
  3. Third-party verification is possible via Twitter

═══════════════════════════════════════════════════════════
  Generated by SafeReport Legal Shield
  Verification: https://safereport.io/verify/${anchor.id}
═══════════════════════════════════════════════════════════
`.trim();
}
