# StarQuik - Stellar DEX Liquidity Pool Manager

A full-stack application for managing Stellar DEX liquidity pools with React frontend and Node.js/Express backend.

## Features

- 🔐 **Freighter Wallet Integration** - Connect your Stellar wallet
- 💱 **Token Swaps** - Swap tokens using Stellar's DEX pathfinding
- 🏊 **Liquidity Pools** - View all available pools
- ➕ **Add Liquidity** - Provide liquidity to earn fees
- ➖ **Remove Liquidity** - Withdraw your position anytime
- 📊 **Dashboard** - View your balances and positions
- 🚰 **Testnet Faucet** - Fund your account with test XLM

## Prerequisites

1. **Node.js** (v16 or higher)
2. **Freighter Wallet** - [Download here](https://www.freighter.app/)
3. **Testnet Account** - Create one at [Stellar Laboratory](https://laboratory.stellar.org/)

## Project Structure

```
starquik/
├── client/                 # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API and wallet services
│   │   ├── styles/         # CSS styles
│   │   └── App.js
│   └── package.json
├── server/                 # Node.js Backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   └── index.js
│   ├── .env
│   └── package.json
└── package.json
```

## Installation

1. **Clone/Navigate to the project:**
   ```bash
   cd starquik
   ```

2. **Install all dependencies:**
   ```bash
   npm run install:all
   ```
   
   Or install separately:
   ```bash
   # Root dependencies
   npm install
   
   # Server dependencies
   cd server && npm install
   
   # Client dependencies  
   cd ../client && npm install
   ```

## Running the Application

### Development Mode (Both client & server)

```bash
npm run dev
```

This starts:
- Backend server on `http://localhost:5000`
- React frontend on `http://localhost:3000`

### Run Separately

```bash
# Start backend only
npm run server

# Start frontend only (in another terminal)
npm run client
```

## Configuration

### Server Environment (.env)

```env
STELLAR_NETWORK=testnet
HORIZON_URL=https://horizon-testnet.stellar.org
NETWORK_PASSPHRASE=Test SDF Network ; September 2015
PORT=5000
```

For **mainnet**, update to:
```env
STELLAR_NETWORK=mainnet
HORIZON_URL=https://horizon.stellar.org
NETWORK_PASSPHRASE=Public Global Stellar Network ; September 2015
```

## Usage Guide

### 1. Connect Wallet
- Install [Freighter](https://www.freighter.app/) browser extension
- Switch to **Testnet** in Freighter settings
- Click "Connect Wallet" in the app

### 2. Fund Your Account (Testnet)
- Click "Fund with Testnet XLM" button
- Receive 10,000 test XLM instantly

### 3. Add Trustlines
- Before using non-XLM tokens, add trustlines
- The app prompts automatically when needed
- Costs 0.5 XLM reserve per trustline

### 4. Swap Tokens
- Select source and destination tokens
- Enter amount to swap
- View real-time quotes
- Confirm in Freighter wallet

### 5. Add Liquidity
- Select two tokens for the pool
- Enter equal values of both
- The app creates pool trustline automatically
- Confirm deposit in Freighter

### 6. Remove Liquidity
- Go to "Pools" → "My Positions"
- Click "Remove Liquidity"
- Enter amount of shares to withdraw
- Receive both tokens back + earned fees

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stellar/account/:publicKey` | GET | Get account info |
| `/api/stellar/pools` | GET | List liquidity pools |
| `/api/stellar/pools/:poolId` | GET | Get specific pool |
| `/api/stellar/account/:publicKey/pools` | GET | Get user's pool positions |
| `/api/stellar/build/trustline` | POST | Build trustline transaction |
| `/api/stellar/build/pool-trustline` | POST | Build pool trustline |
| `/api/stellar/build/deposit` | POST | Build deposit transaction |
| `/api/stellar/build/withdraw` | POST | Build withdraw transaction |
| `/api/stellar/build/swap` | POST | Build swap transaction |
| `/api/stellar/submit` | POST | Submit signed transaction |
| `/api/stellar/quote` | GET | Get swap quote |
| `/api/stellar/fund-testnet` | POST | Fund testnet account |

## Key Concepts

### Trustlines
- Required for holding non-native assets
- Each trustline reserves 0.5 XLM
- Must be added before receiving tokens

### Liquidity Pools
- Constant product AMM (x * y = k)
- 0.3% fee per swap, distributed to LPs
- Fee is 30 basis points (Stellar default)

### Transaction Fees
- Base fee: 0.00001 XLM per operation
- Extremely low compared to other chains

## Troubleshooting

### "Freighter not installed"
→ Install from [freighter.app](https://www.freighter.app/)

### "Failed to sign transaction"
→ Make sure Freighter is unlocked and on correct network

### "No swap path found"
→ The token pair might not have liquidity

### "Trustline not found"
→ Add trustline for the asset first

## Tech Stack

- **Frontend:** React 18, react-hot-toast
- **Backend:** Node.js, Express
- **Blockchain:** Stellar SDK
- **Wallet:** Freighter API

## Resources

- [Stellar Developer Docs](https://developers.stellar.org/docs)
- [Stellar Laboratory](https://laboratory.stellar.org/)
- [Freighter Wallet](https://www.freighter.app/)
- [Stellar SDK Docs](https://stellar.github.io/js-stellar-sdk/)

## License

MIT
