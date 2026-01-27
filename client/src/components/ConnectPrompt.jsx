function ConnectPrompt({ onConnect, loading }) {
  return (
    <div className="connect-prompt">
      <div className="wallet-icon">🔐</div>
      <h2>Connect Your Wallet</h2>
      <p>
        Connect your Freighter wallet to access Stellar DEX liquidity pools, 
        swap tokens, and manage your positions.
      </p>

      <button className="btn btn-primary" onClick={onConnect} disabled={loading}>
        {loading ? (
          <>
            <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
            Connecting...
          </>
        ) : (
          <>Connect Freighter Wallet</>
        )}
      </button>
      <p className="text-muted mt-2" style={{ fontSize: '0.875rem' }}>
        Don't have Freighter?{' '}
        <a 
          href="https://www.freighter.app/" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: '#e94560' }}
        >
          Download here
        </a>
      </p>
      <p className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
        Make sure Freighter is set to <strong>Testnet</strong> and unlocked
      </p>
    </div>
  );
}

export default ConnectPrompt;
