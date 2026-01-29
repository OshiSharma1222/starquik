import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getTransactions } from '../services/api';

const EXPLORER_TX_URL = 'https://stellar.expert/explorer/testnet/tx';
const LIMIT = 20;

function formatDate(isoString) {
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function TransactionHistory({ wallet, onRefresh }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);

  const loadTransactions = async (cursor = null) => {
    if (!wallet?.publicKey) return;
    if (cursor) setLoadingMore(true);
    else setLoading(true);
    try {
      const { transactions: txs, next_cursor } = await getTransactions(
        wallet.publicKey,
        LIMIT,
        cursor || ''
      );
      if (cursor) {
        setTransactions((prev) => [...prev, ...txs]);
      } else {
        setTransactions(txs || []);
      }
      setNextCursor(next_cursor || null);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transaction history');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [wallet?.publicKey]);

  if (!wallet?.publicKey) return null;

  return (
    <div className="swap-container" style={{ maxWidth: '720px' }}>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Transaction History</h3>
          <button
            className="btn btn-secondary"
            onClick={() => loadTransactions()}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {loading && transactions.length === 0 ? (
          <div className="loading">
            <div className="spinner" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📜</div>
            <p>No transactions yet</p>
            <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Your swaps, liquidity, and other activity will appear here
            </p>
          </div>
        ) : (
          <>
            <div className="tx-list">
              {transactions.map((tx) => (
                <a
                  key={tx.id}
                  href={`${EXPLORER_TX_URL}/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tx-row"
                >
                  <div className="tx-status" title={tx.successful ? 'Success' : 'Failed'}>
                    <span className={`tx-status-dot ${tx.successful ? 'success' : 'failed'}`} />
                    <span className={tx.successful ? 'text-success' : 'text-error'}>
                      {tx.successful ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  <div className="tx-meta">
                    <span className="tx-date">{formatDate(tx.created_at)}</span>
                    <span className="tx-ops">{tx.operation_count} op{tx.operation_count !== 1 ? 's' : ''}</span>
                    <span className="tx-fee">Fee: {tx.fee_charged} stroops</span>
                  </div>
                  <div className="tx-hash" title={tx.hash}>
                    {tx.hash.slice(0, 8)}…{tx.hash.slice(-8)}
                  </div>
                  <span className="tx-link">↗</span>
                </a>
              ))}
            </div>
            {nextCursor && (
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => loadTransactions(nextCursor)}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default TransactionHistory;
