import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { fundTestnetAccount, getAccountPools } from '../services/api';

function Dashboard({ account, wallet, onRefresh }) {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [funding, setFunding] = useState(false);

  useEffect(() => {
    if (wallet?.publicKey) {
      loadPools();
    }
  }, [wallet?.publicKey]);

  const loadPools = async () => {
    setLoading(true);
    try {
      const poolData = await getAccountPools(wallet.publicKey);
      setPools(poolData);
    } catch (error) {
      console.error('Error loading pools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFundAccount = async () => {
    setFunding(true);
    try {
      await fundTestnetAccount(wallet.publicKey);
      toast.success('Account funded with 10,000 XLM!');
      onRefresh();
    } catch (error) {
      toast.error(error.message || 'Failed to fund account');
    } finally {
      setFunding(false);
    }
  };

  const getXLMBalance = () => {
    if (!account?.balances) return '0';
    const xlm = account.balances.find(b => b.asset_type === 'native');
    return xlm ? parseFloat(xlm.balance).toFixed(4) : '0';
  };

  const getNonNativeBalances = () => {
    if (!account?.balances) return [];
    return account.balances.filter(b => b.asset_type !== 'native' && b.asset_type !== 'liquidity_pool_shares');
  };

  const formatAssetName = (reserve) => {
    if (reserve.asset === 'native') return 'XLM';
    const [code] = reserve.asset.split(':');
    return code;
  };

  return (
    <div>
      <div className="grid-2 mb-3">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Account Overview</h3>
            <button className="btn btn-secondary" onClick={onRefresh}>
              ↻ Refresh
            </button>
          </div>
          
          <div className="balance-display">
            <span className="balance-label">XLM Balance</span>
            <span className="balance-value">{getXLMBalance()} XLM</span>
          </div>

          {parseFloat(getXLMBalance()) === 0 && (
            <button 
              className="btn btn-success" 
              onClick={handleFundAccount}
              disabled={funding}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              {funding ? 'Funding...' : '🚰 Fund with Testnet XLM'}
            </button>
          )}

          {getNonNativeBalances().length > 0 && (
            <div className="mt-2">
              <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Other Assets
              </h4>
              {getNonNativeBalances().map((balance, index) => (
                <div key={index} className="balance-display" style={{ marginBottom: '0.5rem' }}>
                  <span className="balance-label">{balance.asset_code}</span>
                  <span className="balance-value">{parseFloat(balance.balance).toFixed(4)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Quick Stats</h3>
          </div>
          
          <div className="pool-stats">
            <div className="stat-item">
              <div className="stat-label">Total Trustlines</div>
              <div className="stat-value">{account?.subentry_count || 0}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">LP Positions</div>
              <div className="stat-value">{pools.length}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Network</div>
              <div className="stat-value text-success">Testnet</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Fee/Tx</div>
              <div className="stat-value">0.00001 XLM</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Your Liquidity Positions</h3>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner" />
          </div>
        ) : pools.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏊</div>
            <p>No liquidity positions yet</p>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>
              Add liquidity to earn fees from swaps
            </p>
          </div>
        ) : (
          <div className="grid-3">
            {pools.map((pool, index) => (
              <div key={index} className="pool-card">
                <div className="pool-header">
                  <div className="pool-assets">
                    {pool.pool_details?.reserves?.map((reserve, i) => (
                      <div key={i} className="asset-icon">
                        {formatAssetName(reserve).slice(0, 2)}
                      </div>
                    ))}
                    <span className="pool-pair">
                      {pool.pool_details?.reserves?.map(r => formatAssetName(r)).join(' / ')}
                    </span>
                  </div>
                </div>
                
                <div className="pool-stats">
                  <div className="stat-item">
                    <div className="stat-label">Your Shares</div>
                    <div className="stat-value">{parseFloat(pool.balance).toFixed(4)}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Pool Fee</div>
                    <div className="stat-value">0.3%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
