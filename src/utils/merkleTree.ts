/**
 * Merkle Tree Implementation for Evidence Anchoring
 *
 * Creates a binary Merkle tree from evidence hashes,
 * enabling efficient proof-of-inclusion verification.
 */

// Simple SHA-256 hash using Web Crypto API
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
  data?: string; // Original data for leaf nodes
}

export interface MerkleProof {
  leaf: string;
  root: string;
  proof: Array<{
    hash: string;
    position: 'left' | 'right';
  }>;
}

export interface MerkleTree {
  root: string;
  leaves: string[];
  tree: MerkleNode;
  createdAt: Date;
}

/**
 * Build a Merkle tree from an array of data strings
 */
export async function buildMerkleTree(data: string[]): Promise<MerkleTree> {
  if (data.length === 0) {
    throw new Error('Cannot build Merkle tree from empty data');
  }

  // Hash all leaves
  const leaves = await Promise.all(
    data.map(async (d) => sha256(d))
  );

  // Build tree bottom-up
  const tree = await buildTree(leaves.map(hash => ({ hash, data: hash })));

  return {
    root: tree.hash,
    leaves,
    tree,
    createdAt: new Date(),
  };
}

async function buildTree(nodes: MerkleNode[]): Promise<MerkleNode> {
  if (nodes.length === 1) {
    return nodes[0];
  }

  const nextLevel: MerkleNode[] = [];

  for (let i = 0; i < nodes.length; i += 2) {
    const left = nodes[i];
    const right = nodes[i + 1] || left; // Duplicate last node if odd

    const combinedHash = await sha256(left.hash + right.hash);
    nextLevel.push({
      hash: combinedHash,
      left,
      right: nodes[i + 1] ? right : undefined,
    });
  }

  return buildTree(nextLevel);
}

/**
 * Generate a proof for a specific leaf
 */
export async function generateProof(
  tree: MerkleTree,
  leafIndex: number
): Promise<MerkleProof> {
  if (leafIndex < 0 || leafIndex >= tree.leaves.length) {
    throw new Error('Invalid leaf index');
  }

  const proof: MerkleProof['proof'] = [];
  let currentIndex = leafIndex;
  let nodes = tree.leaves.map(hash => ({ hash }));

  while (nodes.length > 1) {
    const nextLevel: { hash: string }[] = [];

    for (let i = 0; i < nodes.length; i += 2) {
      const left = nodes[i];
      const right = nodes[i + 1] || left;

      // If current index is in this pair, add sibling to proof
      if (i === currentIndex || i + 1 === currentIndex) {
        if (currentIndex % 2 === 0) {
          // Current is left, sibling is right
          if (nodes[i + 1]) {
            proof.push({ hash: right.hash, position: 'right' });
          }
        } else {
          // Current is right, sibling is left
          proof.push({ hash: left.hash, position: 'left' });
        }
      }

      const combinedHash = await sha256(left.hash + right.hash);
      nextLevel.push({ hash: combinedHash });
    }

    currentIndex = Math.floor(currentIndex / 2);
    nodes = nextLevel;
  }

  return {
    leaf: tree.leaves[leafIndex],
    root: tree.root,
    proof,
  };
}

/**
 * Verify a Merkle proof
 */
export async function verifyProof(proof: MerkleProof): Promise<boolean> {
  let currentHash = proof.leaf;

  for (const step of proof.proof) {
    if (step.position === 'left') {
      currentHash = await sha256(step.hash + currentHash);
    } else {
      currentHash = await sha256(currentHash + step.hash);
    }
  }

  return currentHash === proof.root;
}

/**
 * Format Merkle root for Twitter/X posting
 */
export function formatAnchorTweet(
  merkleRoot: string,
  reportCount: number,
  timestamp: Date
): string {
  const dateStr = timestamp.toISOString().split('T')[0];
  const shortRoot = merkleRoot.slice(0, 16);

  return `🛡️ SafeReport Evidence Anchor
📅 ${dateStr}
📊 ${reportCount} reports sealed
🔐 Merkle Root: ${shortRoot}...

#SafeReport #EvidenceIntegrity #LegalTech`;
}

/**
 * Generate anchor data for storage
 */
export interface AnchorRecord {
  id: string;
  merkleRoot: string;
  reportIds: string[];
  tweetId?: string;
  tweetUrl?: string;
  createdAt: Date;
  status: 'pending' | 'anchored' | 'verified';
}

export function createAnchorRecord(
  merkleRoot: string,
  reportIds: string[]
): AnchorRecord {
  return {
    id: `anchor_${Date.now()}_${merkleRoot.slice(0, 8)}`,
    merkleRoot,
    reportIds,
    createdAt: new Date(),
    status: 'pending',
  };
}
