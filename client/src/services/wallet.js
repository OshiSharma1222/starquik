import {
  isConnected,
  isAllowed,
  setAllowed,
  getAddress,
  getNetwork as freighterGetNetwork,
  signTransaction as freighterSignTransaction,
} from '@stellar/freighter-api';

export async function isFreighterInstalled() {
  try {
    const connected = await isConnected();
    return connected;
  } catch (e) {
    return false;
  }
}

export async function connectFreighter() {
  try {
    // Check connection
    const connected = await isConnected();
    if (!connected) {
      throw new Error('Please open Freighter extension and unlock your wallet');
    }

    // Check if our app is allowed
    const allowed = await isAllowed();
    if (!allowed) {
      // Request permission
      await setAllowed();
    }

    // Get the public key
    const addressResult = await getAddress();
    
    if (addressResult.error) {
      throw new Error(addressResult.error);
    }
    
    return addressResult.address;
  } catch (error) {
    console.error('Freighter connection error:', error);
    throw error;
  }
}

export async function getPublicKey() {
  try {
    const connected = await isConnected();
    if (!connected) {
      return null;
    }

    const allowed = await isAllowed();
    if (!allowed) {
      return null;
    }

    const addressResult = await getAddress();
    return addressResult.address || null;
  } catch (error) {
    console.error('Error getting public key:', error);
    return null;
  }
}

export async function signTransaction(xdr, network = 'TESTNET') {
  if (!isFreighterInstalled()) {
    throw new Error('Freighter wallet is not installed');
  }

  const networkPassphrase = network === 'TESTNET'
    ? 'Test SDF Network ; September 2015'
    : 'Public Global Stellar Network ; September 2015';

  try {
    const result = await freighterSignTransaction(xdr, {
      networkPassphrase,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return result.signedTxXdr;
  } catch (error) {
    console.error('Sign transaction error:', error);
    throw error;
  }
}

export async function getNetwork() {
  try {
    if (!isFreighterInstalled()) {
      return null;
    }

    const result = await freighterGetNetwork();
    return result.network || null;
  } catch (error) {
    console.error('Error getting network:', error);
    return null;
  }
}
