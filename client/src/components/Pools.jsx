import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getPools, getAccountPools, buildWithdraw, submitTransaction } from '../services/api';
import { signTransaction } from '../services/wallet';

function Pools({ wallet, account, onRefresh }) {
  const [allPools, setAllPools] = useState([]);
  const [myPools, setMyPools] = useState([]);
  const [activeView, setActiveView] = useState('all');
  const [loading, setLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    loadPools();
  }, [wallet?.publicKey]);

  const loadPools = async () => {
    setLoading(true);
    try {
      const [pools, userPools] = await Promise.all([
        getPools(),
        wallet?.publicKey ? getAccountPools(wallet.publicKey) : []
      ]);
      setAllPools(pools);
      setMyPools(userPools);
    } catch (error) {
      console.error('Error loading pools:', error);
      toast.error('Failed to load pools');
    } finally {
      setLoading(false);
    }
  };

  const formatAssetName = (asset) => {
    if (asset === 'native') return 'XLM';
    const [code] = asset.split(':');
    return code;
  };

  const handleWithdraw = async (pool) => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const poolId = pool.liquidity_pool_id;
      
      const { xdr } = await buildWithdraw(
        wallet.publicKey,
        poolId,
        withdrawAmount,
        '0',
        '0'
      );

      toast.loading('Please confirm in Freighter...', { id: 'withdraw' });
      const signedXdr = await signTransaction(xdr);

      toast.loading('Submitting transaction...', { id: 'withdraw' });
      await submitTransaction(signedXdr);

      toast.success('Liquidity withdrawn successfully!', { id: 'withdraw' });
      setWithdrawing(null);
      setWithdrawAmount('');
      loadPools();
      onRefresh();
    } catch (error) {
      console.error('Withdraw error:', error);
      toast.error(error.message || 'Withdrawal failed', { id: 'withdraw' });
    } finally {
      setLoading(false);
    }
  };

  const renderPoolCard = (pool, isUserPool = false) => {
    const poolData = isUserPool ? pool.pool_details : pool;
    const reserves = poolData?.reserves || [];
    const poolId = isUserPool ? pool.liquidity_pool_id : pool.id;
    const userShares = isUserPool ? pool.balance : null;

    return (
      <div key={poolId} className="pool-card">
        <div className="pool-header">
          <div className="pool-assets">
            {reserves.map((reserve, i) => (
              <div key={i} className="asset-icon">
                {formatAssetName(reserve.asset).slice(0, 2)}
              </div>
            ))}
            <span className="pool-pair">
              {reserves.map(r => formatAssetName(r.asset)).join(' / ')}
            </span>
          </div>
        </div>

        <div className="pool-stats">
          {reserves.map((reserve, i) => (
            <div key={i} className="stat-item">
              <div className="stat-label">{formatAssetName(reserve.asset)} Reserve</div>
              <div className="stat-value">{parseFloat(reserve.amount).toLocaleString()}</div>
            </div>
          ))}
          <div className="stat-item">
            <div className="stat-label">Total Shares</div>
            <div className="stat-value">{parseFloat(poolData?.total_shares || 0).toLocaleString()}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Fee</div>
            <div className="stat-value">0.3%</div>
          </div>
        </div>

        {isUserPool && (
          <div className="mt-2">
            <div className="balance-display">
              <span className="balance-label">Your Shares</span>
              <span className="balance-value">{parseFloat(userShares).toFixed(4)}</span>
            </div>

            {withdrawing === poolId ? (
              <div className="mt-2">
                <div className="form-group">
                  <label className="form-label">Amount to Withdraw</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.0"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    max={userShares}
                  />
                  <button
                    onClick={() => setWithdrawAmount(userShares)}
                    className="text-muted mt-1"
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      color: 'var(--accent-primary)'
                    }}
                  >
                    Max: {parseFloat(userShares).toFixed(4)}
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    className="btn btn-danger"
                    onClick={() => handleWithdraw(pool)}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Confirm Withdraw'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setWithdrawing(null);
                      setWithdrawAmount('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="btn btn-secondary mt-2"
                style={{ width: '100%' }}
                onClick={() => setWithdrawing(poolId)}
              >
                Remove Liquidity
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Liquidity Pools</h3>
          <div className="flex gap-1">
            <button
              className={`btn ${activeView === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveView('all')}
            >
              All Pools
            </button>
            <button
              className={`btn ${activeView === 'my' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveView('my')}
            >
              My Positions ({myPools.length})
            </button>
            <button className="btn btn-secondary" onClick={loadPools}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner" />
          </div>
        ) : activeView === 'my' ? (
          myPools.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏊</div>
              <p>No liquidity positions</p>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                Add liquidity to start earning fees
              </p>
            </div>
          ) : (
            <div className="grid-3">
              {myPools.map(pool => renderPoolCard(pool, true))}
            </div>
          )
        ) : (
          allPools.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <p>No pools found</p>
            </div>
          ) : (
            <div className="grid-3">
              {allPools.map(pool => renderPoolCard(pool, false))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default Pools;
