import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { buildSwap, getSwapQuote, submitTransaction } from '../services/api';
import { signTransaction } from '../services/wallet';

const COMMON_ASSETS = [
  { code: 'XLM', issuer: null, name: 'Stellar Lumens' },
  { code: 'USDC', issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN', name: 'USD Coin (Testnet)' },
  { code: 'SRT', issuer: 'GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B', name: 'StellarRT Token' },
];

function Swap({ wallet, account, onRefresh }) {
  const [sourceAsset, setSourceAsset] = useState(COMMON_ASSETS[0]);
  const [destAsset, setDestAsset] = useState(COMMON_ASSETS[1]);
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [slippage, setSlippage] = useState(1);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (amount && parseFloat(amount) > 0) {
        fetchQuote();
      } else {
        setQuote(null);
        setQuoteError(null);
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [amount, sourceAsset, destAsset]);

  const fetchQuote = async () => {
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const quotes = await getSwapQuote(
        sourceAsset.code,
        sourceAsset.issuer,
        destAsset.code,
        destAsset.issuer,
        amount
      );
      if (quotes && quotes.length > 0) {
        setQuote(quotes[0]);
        setQuoteError(null);
      } else {
        setQuote(null);
        setQuoteError('No swap path found. There may not be enough liquidity for this pair.');
      }
    } catch (error) {
      console.error('Quote error:', error);
      setQuote(null);
      const errorMessage = error.message || 'Failed to get quote';
      setQuoteError(errorMessage.includes('No swap path') || errorMessage.includes('No path') 
        ? 'No swap path found. There may not be enough liquidity for this pair.'
        : errorMessage);
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleSwapDirection = () => {
    setSourceAsset(destAsset);
    setDestAsset(sourceAsset);
    setAmount('');
    setQuote(null);
  };

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

  const handleSwap = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const { xdr, expectedAmount } = await buildSwap(
        wallet.publicKey,
        { code: sourceAsset.code, issuer: sourceAsset.issuer },
        { code: destAsset.code, issuer: destAsset.issuer },
        amount,
        slippage
      );

      toast.loading('Please confirm in Freighter...', { id: 'swap' });
      const signedXdr = await signTransaction(xdr);

      toast.loading('Submitting transaction...', { id: 'swap' });
      await submitTransaction(signedXdr);

      toast.success(`Swapped ${amount} ${sourceAsset.code} for ~${parseFloat(expectedAmount).toFixed(4)} ${destAsset.code}`, { id: 'swap' });
      setAmount('');
      setQuote(null);
      onRefresh();
    } catch (error) {
      console.error('Swap error:', error);
      toast.error(error.message || 'Swap failed', { id: 'swap' });
    } finally {
      setLoading(false);
    }
  };

  const handleMaxClick = () => {
    const balance = getBalance(sourceAsset);
    if (sourceAsset.code === 'XLM' && !sourceAsset.issuer) {
      const max = Math.max(0, parseFloat(balance) - 1);
      setAmount(max.toString());
    } else {
      setAmount(balance);
    }
  };

  return (
    <div className="swap-container">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Swap Tokens</h3>
          <div className="flex items-center gap-1">
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>Slippage:</span>
            <select
              value={slippage}
              onChange={(e) => setSlippage(parseFloat(e.target.value))}
              className="form-input form-select"
              style={{ width: 'auto', padding: '0.5rem' }}
            >
              <option value={0.5}>0.5%</option>
              <option value={1}>1%</option>
              <option value={2}>2%</option>
              <option value={5}>5%</option>
            </select>
          </div>
        </div>

        <div className="swap-input-container">
          <div className="swap-input-header">
            <span className="swap-input-label">From</span>
            <span className="swap-balance">
              Balance: {getBalance(sourceAsset)}
              <button 
                onClick={handleMaxClick}
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
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <select
              className="token-select"
              value={`${sourceAsset.code}:${sourceAsset.issuer || ''}`}
              onChange={(e) => {
                const [code, issuer] = e.target.value.split(':');
                const asset = COMMON_ASSETS.find(a => a.code === code && (a.issuer || '') === issuer);
                if (asset) setSourceAsset(asset);
              }}
            >
              {COMMON_ASSETS.map((asset) => (
                <option key={`${asset.code}:${asset.issuer || ''}`} value={`${asset.code}:${asset.issuer || ''}`}>
                  {asset.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="swap-arrow">
          <button className="swap-arrow-btn" onClick={handleSwapDirection}>
            ↓↑
          </button>
        </div>

        <div className="swap-input-container">
          <div className="swap-input-header">
            <span className="swap-input-label">To</span>
            <span className="swap-balance">Balance: {getBalance(destAsset)}</span>
          </div>
          <div className="swap-input-row">
            <input
              type="number"
              className="swap-amount-input"
              placeholder="0.0"
              value={quote?.destination_amount ? parseFloat(quote.destination_amount).toFixed(6) : ''}
              readOnly
            />
            <select
              className="token-select"
              value={`${destAsset.code}:${destAsset.issuer || ''}`}
              onChange={(e) => {
                const [code, issuer] = e.target.value.split(':');
                const asset = COMMON_ASSETS.find(a => a.code === code && (a.issuer || '') === issuer);
                if (asset) setDestAsset(asset);
              }}
            >
              {COMMON_ASSETS.map((asset) => (
                <option key={`${asset.code}:${asset.issuer || ''}`} value={`${asset.code}:${asset.issuer || ''}`}>
                  {asset.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(quote || quoteLoading || quoteError) && (
          <div className="quote-display">
            {quoteLoading ? (
              <div className="flex items-center justify-between">
                <span className="text-muted">Fetching quote...</span>
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              </div>
            ) : quoteError ? (
              <div style={{ color: '#ef5350', padding: '0.5rem', textAlign: 'center' }}>
                {quoteError}
              </div>
            ) : quote && (
              <>
                <div className="quote-row">
                  <span className="quote-label">Rate</span>
                  <span className="quote-value">
                    1 {sourceAsset.code} ≈ {(parseFloat(quote.destination_amount) / parseFloat(amount)).toFixed(6)} {destAsset.code}
                  </span>
                </div>
                <div className="quote-row">
                  <span className="quote-label">Expected Output</span>
                  <span className="quote-value">{parseFloat(quote.destination_amount).toFixed(6)} {destAsset.code}</span>
                </div>
                <div className="quote-row">
                  <span className="quote-label">Minimum Received</span>
                  <span className="quote-value">
                    {(parseFloat(quote.destination_amount) * (1 - slippage / 100)).toFixed(6)} {destAsset.code}
                  </span>
                </div>
                <div className="quote-row">
                  <span className="quote-label">Slippage Tolerance</span>
                  <span className="quote-value">{slippage}%</span>
                </div>
              </>
            )}
          </div>
        )}

        <button
          className="btn btn-primary mt-2"
          style={{ width: '100%' }}
          onClick={handleSwap}
          disabled={loading || !amount || parseFloat(amount) <= 0 || !quote}
        >
          {loading ? 'Swapping...' : 'Swap'}
        </button>
      </div>
    </div>
  );
}

export default Swap;
