const API_BASE = 'http://localhost:5000/api/stellar';

export async function getAccount(publicKey) {
  const response = await fetch(`${API_BASE}/account/${publicKey}`);
  if (!response.ok) {
    throw new Error('Failed to fetch account');
  }
  return response.json();
}

export async function getPools(reserves = '') {
  const url = reserves ? `${API_BASE}/pools?reserves=${reserves}` : `${API_BASE}/pools`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch pools');
  }
  return response.json();
}

export async function getPool(poolId) {
  const response = await fetch(`${API_BASE}/pools/${poolId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch pool');
  }
  return response.json();
}

export async function getAccountPools(publicKey) {
  const response = await fetch(`${API_BASE}/account/${publicKey}/pools`);
  if (!response.ok) {
    throw new Error('Failed to fetch account pools');
  }
  return response.json();
}

export async function buildTrustline(publicKey, assetCode, assetIssuer) {
  const response = await fetch(`${API_BASE}/build/trustline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicKey, assetCode, assetIssuer }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to build trustline');
  }
  return response.json();
}

export async function buildPoolTrustline(publicKey, assetA, assetB) {
  const response = await fetch(`${API_BASE}/build/pool-trustline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicKey, assetA, assetB }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to build pool trustline');
  }
  return response.json();
}

export async function buildDeposit(publicKey, poolId, maxAmountA, maxAmountB, minPrice, maxPrice) {
  const response = await fetch(`${API_BASE}/build/deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicKey, poolId, maxAmountA, maxAmountB, minPrice, maxPrice }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to build deposit');
  }
  return response.json();
}

export async function buildWithdraw(publicKey, poolId, amount, minAmountA, minAmountB) {
  const response = await fetch(`${API_BASE}/build/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicKey, poolId, amount, minAmountA, minAmountB }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to build withdraw');
  }
  return response.json();
}

export async function buildSwap(publicKey, sourceAsset, destAsset, amount, slippage = 1) {
  const response = await fetch(`${API_BASE}/build/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicKey, sourceAsset, destAsset, amount, slippage }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to build swap');
  }
  return response.json();
}

export async function submitTransaction(signedXdr) {
  const response = await fetch(`${API_BASE}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signedXdr }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit transaction');
  }
  return response.json();
}

export async function getSwapQuote(sourceCode, sourceIssuer, destCode, destIssuer, amount) {
  const params = new URLSearchParams({
    sourceCode,
    destCode,
    amount,
  });
  if (sourceIssuer) params.append('sourceIssuer', sourceIssuer);
  if (destIssuer) params.append('destIssuer', destIssuer);
  
  const response = await fetch(`${API_BASE}/quote?${params}`);
  if (!response.ok) {
    throw new Error('Failed to get quote');
  }
  return response.json();
}

export async function getAssets(code = '') {
  const url = code ? `${API_BASE}/assets?code=${code}` : `${API_BASE}/assets`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch assets');
  }
  return response.json();
}

export async function fundTestnetAccount(publicKey) {
  const response = await fetch(`${API_BASE}/fund-testnet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicKey }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fund account');
  }
  return response.json();
}
