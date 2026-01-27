function Header({ wallet, onConnect, onDisconnect, activeTab, setActiveTab, loading }) {
  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="header">
      <div className="logo">
        <div className="logo-icon">⚡</div>
        <h1>StarQuik</h1>
        <span className="network-badge">Testnet</span>
      </div>

      {wallet && (
        <nav className="tab-nav">
          <button
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`tab-btn ${activeTab === 'swap' ? 'active' : ''}`}
            onClick={() => setActiveTab('swap')}
          >
            Swap
          </button>
          <button
            className={`tab-btn ${activeTab === 'pools' ? 'active' : ''}`}
            onClick={() => setActiveTab('pools')}
          >
            Pools
          </button>
          <button
            className={`tab-btn ${activeTab === 'add-liquidity' ? 'active' : ''}`}
            onClick={() => setActiveTab('add-liquidity')}
          >
            Add Liquidity
          </button>
        </nav>
      )}

      <div className="wallet-info">
        {wallet ? (
          <>
            <span className="wallet-address">{truncateAddress(wallet.publicKey)}</span>
            <button className="btn btn-secondary" onClick={onDisconnect}>
              Disconnect
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={onConnect} disabled={loading}>
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
