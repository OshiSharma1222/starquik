import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { buildPoolTrustline, buildDeposit, submitTransaction, buildTrustline } from '../services/api';
import { signTransaction } from '../services/wallet';

const COMMON_ASSETS = [
  { code: 'XLM', issuer: null, name: 'Stellar Lumens (Native)' },
  { code: 'USDC', issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN', name: 'USD Coin (Testnet)' },
  { code: 'SRT', issuer: 'GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B', name: 'StellarRT Token' },
];

function AddLiquidity({ wallet, account, onRefresh }) {
  const [assetA, setAssetA] = useState(COMMON_ASSETS[0]);
  const [assetB, setAssetB] = useState(COMMON_ASSETS[1]);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [loading, setLoading] = useState(false);
  const [customAsset, setCustomAsset] = useState({ code: '', issuer: '' });
  const [useCustomAsset, setUseCustomAsset] = useState(false);

  const getBalance = (asset) => {
    if (!account?.balances) return '0';
    if (asset.code === 'XLM' && !asset.issuer) {
      const xlm = account.balances.find(b => b.asset_type === 'native');
      return xlm ? parseFloat(xlm.balance).toFixed(4) : '0';
    }
    const found = account.balances.find(
      b => b.asset_code === asset.code && b.asset_issuer === asset.issuer
    );
    return found ? parseFloat(found.balance).toFixed(4) : '0';
  };

  const hasTrustline = (asset) => {
    if (!account?.balances) return false;
    if (asset.code === 'XLM' && !asset.issuer) return true;
    return account.balances.some(
      b => b.asset_code === asset.code && b.asset_issuer === asset.issuer
    );
  };

  const handleAddTrustline = async (asset) => {
    if (!asset.issuer) {
      toast.error('XLM does not require a trustline');
      return;
    }

    setLoading(true);
    try {
      const { xdr } = await buildTrustline(wallet.publicKey, asset.code, asset.issuer);
      
      toast.loading('Please confirm in Freighter...', { id: 'trustline' });
      const signedXdr = await signTransaction(xdr);
      
      toast.loading('Submitting transaction...', { id: 'trustline' });
      await submitTransaction(signedXdr);
      
      toast.success(`Trustline added for ${asset.code}!`, { id: 'trustline' });
      onRefresh();
    } catch (error) {
      console.error('Trustline error:', error);
      toast.error(error.message || 'Failed to add trustline', { id: 'trustline' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddLiquidity = async () => {
    if (!amountA || !amountB || parseFloat(amountA) <= 0 || parseFloat(amountB) <= 0) {
      toast.error('Please enter valid amounts for both assets');
      return;
    }

    const finalAssetB = useCustomAsset ? customAsset : assetB;

    if (useCustomAsset && (!customAsset.code || !customAsset.issuer)) {
      toast.error('Please enter custom asset code and issuer');
      return;
    }

    setLoading(true);
    try {
      toast.loading('Creating pool trustline...', { id: 'liquidity' });
      
      const { xdr: trustlineXdr, poolId } = await buildPoolTrustline(
        wallet.publicKey,
        { code: assetA.code, issuer: assetA.issuer },
        { code: finalAssetB.code, issuer: finalAssetB.issuer }
      );

      toast.loading('Please confirm pool trustline in Freighter...', { id: 'liquidity' });
      const signedTrustline = await signTransaction(trustlineXdr);
      
      await submitTransaction(signedTrustline);
      toast.loading('Pool trustline created! Building deposit...', { id: 'liquidity' });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const { xdr: depositXdr } = await buildDeposit(
        wallet.publicKey,
        poolId,
        amountA,
        amountB,
        '0.0000001',
        '100000000'
      );

      toast.loading('Please confirm deposit in Freighter...', { id: 'liquidity' });
      const signedDeposit = await signTransaction(depositXdr);
      
      toast.loading('Submitting deposit...', { id: 'liquidity' });
      await submitTransaction(signedDeposit);

      toast.success('Liquidity added successfully!', { id: 'liquidity' });
      setAmountA('');
      setAmountB('');
      onRefresh();
    } catch (error) {
      console.error('Add liquidity error:', error);
      toast.error(error.message || 'Failed to add liquidity', { id: 'liquidity' });
    } finally {
      setLoading(false);
    }
  };

  const finalAssetB = useCustomAsset ? customAsset : assetB;

  return (
    <div className="swap-container">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Add Liquidity</h3>
        </div>

        <div className="mb-2" style={{ 
          background: 'var(--bg-secondary)', 
          padding: '1rem', 
          borderRadius: '12px',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)'
        }}>
          <p><strong>ℹ️ How it works:</strong></p>
          <ul style={{ marginLeft: '1rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
            <li>Provide equal values of two tokens</li>
            <li>Earn 0.3% fees from every swap</li>
            <li>Withdraw anytime with earned fees</li>
            <li>Requires trustlines for non-XLM assets</li>
          </ul>
        </div>

        <div className="form-group">
          <label className="form-label">First Asset</label>
          <div className="swap-input-container">
            <div className="swap-input-header">
              <span className="swap-input-label">Amount</span>
              <span className="swap-balance">
                Balance: {getBalance(assetA)}
                <button 
                  onClick={() => {
                    const bal = getBalance(assetA);
                    if (assetA.code === 'XLM') {
                      setAmountA(Math.max(0, parseFloat(bal) - 2).toString());
                    } else {
                      setAmountA(bal);
                    }
                  }}
                  style={{ 
                    marginLeft: '0.5rem', 
                    color: 'var(--accent-primary)', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  MAX
                </button>
              </span>
            </div>
            <div className="swap-input-row">
              <input
                type="number"
                className="swap-amount-input"
                placeholder="0.0"
                value={amountA}
                onChange={(e) => setAmountA(e.target.value)}
              />
              <select
                className="token-select"
                value={`${assetA.code}:${assetA.issuer || ''}`}
                onChange={(e) => {
                  const [code, issuer] = e.target.value.split(':');
                  const asset = COMMON_ASSETS.find(a => a.code === code && (a.issuer || '') === issuer);
                  if (asset) setAssetA(asset);
                }}
              >
                {COMMON_ASSETS.map((asset) => (
                  <option key={`a-${asset.code}:${asset.issuer || ''}`} value={`${asset.code}:${asset.issuer || ''}`}>
                    {asset.code}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', margin: '0.5rem 0', fontSize: '1.5rem' }}>+</div>

        <div className="form-group">
          <label className="form-label">Second Asset</label>
          <div className="mb-1">
            <label className="flex items-center gap-1" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useCustomAsset}
                onChange={(e) => setUseCustomAsset(e.target.checked)}
              />
              <span className="text-muted" style={{ fontSize: '0.875rem' }}>Use custom asset</span>
            </label>
          </div>

          {useCustomAsset ? (
            <div>
              <input
                type="text"
                className="form-input mb-1"
                placeholder="Asset Code (e.g., MYTOKEN)"
                value={customAsset.code}
                onChange={(e) => setCustomAsset({ ...customAsset, code: e.target.value.toUpperCase() })}
              />
              <input
                type="text"
                className="form-input mb-1"
                placeholder="Issuer Public Key (G...)"
                value={customAsset.issuer}
                onChange={(e) => setCustomAsset({ ...customAsset, issuer: e.target.value })}
              />
              <input
                type="number"
                className="form-input"
                placeholder="Amount"
                value={amountB}
                onChange={(e) => setAmountB(e.target.value)}
              />
              {customAsset.code && customAsset.issuer && !hasTrustline(customAsset) && (
                <button
                  className="btn btn-secondary mt-1"
                  onClick={() => handleAddTrustline(customAsset)}
                  disabled={loading}
                >
                  Add Trustline for {customAsset.code}
                </button>
              )}
            </div>
          ) : (
            <div className="swap-input-container">
              <div className="swap-input-header">
                <span className="swap-input-label">Amount</span>
                <span className="swap-balance">
                  Balance: {getBalance(assetB)}
                  <button 
                    onClick={() => setAmountB(getBalance(assetB))}
                    style={{ 
                      marginLeft: '0.5rem', 
                      color: 'var(--accent-primary)', 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    MAX
                  </button>
                </span>
              </div>
              <div className="swap-input-row">
                <input
                  type="number"
                  className="swap-amount-input"
                  placeholder="0.0"
                  value={amountB}
                  onChange={(e) => setAmountB(e.target.value)}
                />
                <select
                  className="token-select"
                  value={`${assetB.code}:${assetB.issuer || ''}`}
                  onChange={(e) => {
                    const [code, issuer] = e.target.value.split(':');
                    const asset = COMMON_ASSETS.find(a => a.code === code && (a.issuer || '') === issuer);
                    if (asset) setAssetB(asset);
                  }}
                >
                  {COMMON_ASSETS.filter(a => a.code !== assetA.code || a.issuer !== assetA.issuer).map((asset) => (
                    <option key={`b-${asset.code}:${asset.issuer || ''}`} value={`${asset.code}:${asset.issuer || ''}`}>
                      {asset.code}
                    </option>
                  ))}
                </select>
              </div>
              {!hasTrustline(assetB) && assetB.issuer && (
                <button
                  className="btn btn-secondary mt-1"
                  style={{ width: '100%' }}
                  onClick={() => handleAddTrustline(assetB)}
                  disabled={loading}
                >
                  Add Trustline for {assetB.code} (Required)
                </button>
              )}
            </div>
          )}
        </div>

        {amountA && amountB && (
          <div className="quote-display mb-2">
            <div className="quote-row">
              <span className="quote-label">You're providing</span>
              <span className="quote-value">{amountA} {assetA.code}</span>
            </div>
            <div className="quote-row">
              <span className="quote-label">And</span>
              <span className="quote-value">{amountB} {finalAssetB.code}</span>
            </div>
            <div className="quote-row">
              <span className="quote-label">Pool Fee</span>
              <span className="quote-value text-success">0.3% per swap</span>
            </div>
          </div>
        )}

        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          onClick={handleAddLiquidity}
          disabled={loading || !amountA || !amountB || parseFloat(amountA) <= 0 || parseFloat(amountB) <= 0}
        >
          {loading ? 'Processing...' : 'Add Liquidity'}
        </button>
      </div>
    </div>
  );
}

export default AddLiquidity;
