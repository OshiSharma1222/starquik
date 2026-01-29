import { useCallback, useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import AddLiquidity from './components/AddLiquidity';
import ConnectPrompt from './components/ConnectPrompt';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import Pools from './components/Pools';
import Swap from './components/Swap';
import TransactionHistory from './components/TransactionHistory';
import { getAccount } from './services/api';
import { connectFreighter, getPublicKey } from './services/wallet';

function App() {
  const [wallet, setWallet] = useState(null);
  const [account, setAccount] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  const loadAccount = useCallback(async (publicKey) => {
    try {
      const accountData = await getAccount(publicKey);
      setAccount(accountData);
    } catch (error) {
      console.error('Error loading account:', error);
      toast.error('Failed to load account data');
    }
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const publicKey = await connectFreighter();
      if (publicKey) {
        setWallet({ publicKey });
        await loadAccount(publicKey);
        toast.success('Wallet connected!');
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setWallet(null);
    setAccount(null);
    toast.success('Wallet disconnected');
  };

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const publicKey = await getPublicKey();
        if (publicKey) {
          setWallet({ publicKey });
          await loadAccount(publicKey);
        }
      } catch (error) {
        // Not connected
      }
    };
    checkConnection();
  }, [loadAccount]);

  const refreshAccount = () => {
    if (wallet?.publicKey) {
      loadAccount(wallet.publicKey);
    }
  };

  const renderContent = () => {
    if (!wallet) {
      return <ConnectPrompt onConnect={handleConnect} loading={loading} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard account={account} wallet={wallet} onRefresh={refreshAccount} />;
      case 'swap':
        return <Swap wallet={wallet} account={account} onRefresh={refreshAccount} />;
      case 'pools':
        return <Pools wallet={wallet} account={account} onRefresh={refreshAccount} />;
      case 'add-liquidity':
        return <AddLiquidity wallet={wallet} account={account} onRefresh={refreshAccount} />;
      case 'history':
        return <TransactionHistory wallet={wallet} onRefresh={refreshAccount} />;
      default:
        return <Dashboard account={account} wallet={wallet} onRefresh={refreshAccount} />;
    }
  };

  return (
    <div className="app">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid #2a2a4a',
          },
          success: {
            iconTheme: {
              primary: '#00d9a5',
              secondary: '#1a1a2e',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef5350',
              secondary: '#1a1a2e',
            },
          },
        }}
      />
      <Header
        wallet={wallet}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        loading={loading}
      />
      <main className="main-container">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
