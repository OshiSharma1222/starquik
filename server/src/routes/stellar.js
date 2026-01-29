const express = require('express');
const router = express.Router();
const StellarSdk = require('@stellar/stellar-sdk');

const HORIZON_URL = process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = process.env.NETWORK_PASSPHRASE || StellarSdk.Networks.TESTNET;

const server = new StellarSdk.Horizon.Server(HORIZON_URL);

// Get account info
router.get('/account/:publicKey', async (req, res) => {
  try {
    const { publicKey } = req.params;
    const account = await server.loadAccount(publicKey);
    
    res.json({
      id: account.id,
      sequence: account.sequence,
      balances: account.balances,
      subentry_count: account.subentry_count,
      thresholds: account.thresholds,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get account transaction history
router.get('/account/:publicKey/transactions', async (req, res) => {
  try {
    const { publicKey } = req.params;
    const { limit = 30, cursor } = req.query;
    const limitNum = Math.min(Math.max(1, Number(limit) || 30), 100);
    let txCall = server.transactions().forAccount(publicKey).limit(limitNum).order('desc');
    if (cursor) txCall = txCall.cursor(cursor);
    const result = await txCall.call();
    const records = result.records || [];
    const transactions = records.map((tx) => ({
      id: tx.id,
      hash: tx.hash,
      created_at: tx.created_at,
      successful: tx.successful,
      fee_charged: tx.fee_charged,
      operation_count: tx.operation_count,
      source_account: tx.source_account,
      paging_token: tx.paging_token,
    }));
    const hasMore = records.length === limitNum && records.length > 0;
    const nextCursor = hasMore ? records[records.length - 1].paging_token : null;
    res.json({
      transactions,
      next_cursor: nextCursor,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get liquidity pools
router.get('/pools', async (req, res) => {
  try {
    const { reserves } = req.query;
    let poolsCall = server.liquidityPools();
    
    if (reserves) {
      poolsCall = poolsCall.forAssets(reserves);
    }
    
    const pools = await poolsCall.limit(20).call();
    res.json(pools.records);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get specific liquidity pool
router.get('/pools/:poolId', async (req, res) => {
  try {
    const { poolId } = req.params;
    const pool = await server.liquidityPools().liquidityPoolId(poolId).call();
    res.json(pool);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get account's liquidity pool shares
router.get('/account/:publicKey/pools', async (req, res) => {
  try {
    const { publicKey } = req.params;
    const account = await server.loadAccount(publicKey);
    
    const poolShares = account.balances.filter(
      balance => balance.asset_type === 'liquidity_pool_shares'
    );
    
    // Get detailed info for each pool
    const poolDetails = await Promise.all(
      poolShares.map(async (share) => {
        try {
          const pool = await server.liquidityPools().liquidityPoolId(share.liquidity_pool_id).call();
          return {
            ...share,
            pool_details: pool,
          };
        } catch (e) {
          return share;
        }
      })
    );
    
    res.json(poolDetails);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Build transaction for adding trustline to liquidity pool
router.post('/build/trustline', async (req, res) => {
  try {
    const { publicKey, assetCode, assetIssuer } = req.body;
    
    const account = await server.loadAccount(publicKey);
    const asset = new StellarSdk.Asset(assetCode, assetIssuer);
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(StellarSdk.Operation.changeTrust({ asset }))
      .setTimeout(180)
      .build();
    
    res.json({ xdr: transaction.toXDR() });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Build transaction for liquidity pool trustline
router.post('/build/pool-trustline', async (req, res) => {
  try {
    const { publicKey, assetA, assetB } = req.body;
    
    const account = await server.loadAccount(publicKey);
    
    // Create asset objects
    const getAsset = (asset) => {
      if (asset.code === 'XLM' && !asset.issuer) {
        return StellarSdk.Asset.native();
      }
      return new StellarSdk.Asset(asset.code, asset.issuer);
    };
    
    const stellarAssetA = getAsset(assetA);
    const stellarAssetB = getAsset(assetB);
    
    // Create liquidity pool asset
    const lpAsset = new StellarSdk.LiquidityPoolAsset(
      stellarAssetA,
      stellarAssetB,
      StellarSdk.LiquidityPoolFeeV18
    );
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(StellarSdk.Operation.changeTrust({
        asset: lpAsset,
      }))
      .setTimeout(180)
      .build();
    
    res.json({ 
      xdr: transaction.toXDR(),
      poolId: StellarSdk.getLiquidityPoolId('constant_product', lpAsset.getLiquidityPoolParameters()).toString('hex')
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Build deposit transaction
router.post('/build/deposit', async (req, res) => {
  try {
    const { publicKey, poolId, maxAmountA, maxAmountB, minPrice, maxPrice } = req.body;
    
    const account = await server.loadAccount(publicKey);
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(StellarSdk.Operation.liquidityPoolDeposit({
        liquidityPoolId: poolId,
        maxAmountA: maxAmountA.toString(),
        maxAmountB: maxAmountB.toString(),
        minPrice: minPrice || '0.0000001',
        maxPrice: maxPrice || '100000000',
      }))
      .setTimeout(180)
      .build();
    
    res.json({ xdr: transaction.toXDR() });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Build withdraw transaction
router.post('/build/withdraw', async (req, res) => {
  try {
    const { publicKey, poolId, amount, minAmountA, minAmountB } = req.body;
    
    const account = await server.loadAccount(publicKey);
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(StellarSdk.Operation.liquidityPoolWithdraw({
        liquidityPoolId: poolId,
        amount: amount.toString(),
        minAmountA: minAmountA || '0',
        minAmountB: minAmountB || '0',
      }))
      .setTimeout(180)
      .build();
    
    res.json({ xdr: transaction.toXDR() });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Build swap transaction (path payment)
router.post('/build/swap', async (req, res) => {
  try {
    const { publicKey, sourceAsset, destAsset, amount, slippage = 1 } = req.body;
    
    const account = await server.loadAccount(publicKey);
    
    const getAsset = (asset) => {
      if (asset.code === 'XLM' && !asset.issuer) {
        return StellarSdk.Asset.native();
      }
      return new StellarSdk.Asset(asset.code, asset.issuer);
    };
    
    const source = getAsset(sourceAsset);
    const dest = getAsset(destAsset);
    
    // Find path
    let paths;
    try {
      paths = await server.strictSendPaths(source, amount.toString(), [dest]).call();
    } catch (pathError) {
      console.error('Path finding error:', pathError);
      return res.status(400).json({ 
        error: `Failed to find swap path: ${pathError.message}. This may be because there is no liquidity pool available for ${sourceAsset.code} to ${destAsset.code}.` 
      });
    }
    
    if (!paths.records || paths.records.length === 0) {
      return res.status(400).json({ 
        error: `No swap path found from ${sourceAsset.code} to ${destAsset.code}. There may not be enough liquidity or no liquidity pool exists for this pair.` 
      });
    }
    
    const bestPath = paths.records[0];
    const minDestAmount = (parseFloat(bestPath.destination_amount) * (1 - slippage / 100)).toFixed(7);
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(StellarSdk.Operation.pathPaymentStrictSend({
        sendAsset: source,
        sendAmount: amount.toString(),
        destination: publicKey,
        destAsset: dest,
        destMin: minDestAmount,
        path: bestPath.path.map(p => 
          p.asset_type === 'native' ? StellarSdk.Asset.native() : new StellarSdk.Asset(p.asset_code, p.asset_issuer)
        ),
      }))
      .setTimeout(180)
      .build();
    
    res.json({ 
      xdr: transaction.toXDR(),
      expectedAmount: bestPath.destination_amount,
      minAmount: minDestAmount,
      path: bestPath.path,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Submit signed transaction
router.post('/submit', async (req, res) => {
  try {
    const { signedXdr } = req.body;
    const transaction = StellarSdk.TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
    const result = await server.submitTransaction(transaction);
    res.json(result);
  } catch (error) {
    res.status(400).json({ 
      error: error.message,
      extras: error.response?.data?.extras 
    });
  }
});

// Get swap quote
router.get('/quote', async (req, res) => {
  try {
    const { sourceCode, sourceIssuer, destCode, destIssuer, amount } = req.query;
    
    const getAsset = (code, issuer) => {
      if (code === 'XLM' && !issuer) {
        return StellarSdk.Asset.native();
      }
      return new StellarSdk.Asset(code, issuer);
    };
    
    const source = getAsset(sourceCode, sourceIssuer);
    const dest = getAsset(destCode, destIssuer);
    
    let paths;
    try {
      paths = await server.strictSendPaths(source, amount, [dest]).call();
    } catch (pathError) {
      console.error('Quote path finding error:', pathError);
      return res.status(400).json({ 
        error: `Failed to find swap path: ${pathError.message}. This may be because there is no liquidity pool available for ${sourceCode} to ${destCode}.` 
      });
    }
    
    if (!paths.records || paths.records.length === 0) {
      return res.status(400).json({ 
        error: `No swap path found from ${sourceCode} to ${destCode}. There may not be enough liquidity or no liquidity pool exists for this pair.` 
      });
    }
    
    res.json(paths.records.map(p => ({
      destination_amount: p.destination_amount,
      path: p.path,
      source_amount: p.source_amount,
    })));
  } catch (error) {
    console.error('Quote error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get known assets (for token selection)
router.get('/assets', async (req, res) => {
  try {
    const { code } = req.query;
    let assetsCall = server.assets();
    
    if (code) {
      assetsCall = assetsCall.forCode(code);
    }
    
    const assets = await assetsCall.limit(20).call();
    res.json(assets.records);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Fund testnet account
router.post('/fund-testnet', async (req, res) => {
  try {
    const { publicKey } = req.body;
    const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
    const result = await response.json();
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
