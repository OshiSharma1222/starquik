import {
  getAddress,
  isAllowed,
  isConnected,
  setAllowed,
  signTransaction as freighterSignTransaction,
  getNetwork as freighterGetNetwork,
} from '@stellar/freighter-api';

export async function isFreighterInstalled() {
  try {
    const result = await isConnected();
    // v2.x returns { isConnected: boolean }
    return result?.isConnected === true;
  } catch (e) {
    console.log('Freighter check error:', e);
    return false;
  }
}

export async function connectFreighter() {
  try {
    // Check if Freighter is installed and connected
    const connResult = await isConnected();
    console.log('isConnected result:', connResult);
    
    if (!connResult?.isConnected) {
      throw new Error('Please install and open Freighter extension');
    }

    // Check if our app is allowed
    const allowedResult = await isAllowed();
    console.log('isAllowed result:', allowedResult);
    
    if (!allowedResult?.isAllowed) {
      // Request permission
      const setAllowedResult = await setAllowed();
      console.log('setAllowed result:', setAllowedResult);
    }

    // Get the public key
    const addressResult = await getAddress();
    console.log('getAddress result:', addressResult);
    
    if (addressResult?.error) {
      throw new Error(addressResult.error);
    }
    
    return addressResult?.address;
  } catch (error) {
    console.error('Freighter connection error:', error);
    throw error;
  }
}

export async function getPublicKey() {
  try {
    const connResult = await isConnected();
    if (!connResult?.isConnected) {
      return null;
    }

    const allowedResult = await isAllowed();
    if (!allowedResult?.isAllowed) {
      return null;
    }

    const addressResult = await getAddress();
    return addressResult?.address || null;
  } catch (error) {
    console.error('Error getting public key:', error);
    return null;
  }
}

export async function signTransaction(xdr, network = 'TESTNET') {
  const installed = await isFreighterInstalled();
  if (!installed) {
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
    const installed = await isFreighterInstalled();
    if (!installed) {
      return null;
    }

    const result = await freighterGetNetwork();
    return result.network || null;
  } catch (error) {
    console.error('Error getting network:', error);
    return null;
  }
}
