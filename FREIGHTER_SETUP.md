# Wallet Setup for Testing

**Recommended for development**: Freighter provides browser-based signing with no phone required.
The app connects through a multi-wallet modal (StellarWalletsKit), so any supported wallet works.

---

## Supported Wallets

| Wallet | Type | Testnet | Notes |
|--------|------|---------|-------|
| Freighter | Browser extension | ✅ | Recommended for development — instant signing |
| xBull | Browser extension | ✅ | Good Freighter alternative |
| Lobstr | Mobile | ✅ | Best for production users; phone required to sign |
| Albedo | Web | ✅ | No install — browser-based signing |

Connect flow: click "Connect Wallet" → pick a wallet in the modal → approve.
The app binds the signer to the wallet module you selected — popups from any
other wallet mean something is wrong (see Troubleshooting).

---

## Quick Start

1. **Install Freighter Extension**
   - Chrome/Brave: https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/freighter/

2. **Import Test Account**
   - Open Freighter → "Import wallet" → "Import using secret key"
   - Get the secret key from your CLI identity:
     ```bash
     stellar keys show freighter1 --network testnet
     ```
   - Switch network to "Testnet" in Freighter settings

 3. **Connect to Sharpy dApp**
    - Visit https://sharpy-sigma.vercel.app
    - Click "Connect Wallet"
    - Select "Freighter" from the modal
    - Approve connection

### Session Expiry After Refresh

The signer is intentionally **not** restored on page refresh — only the address
is kept for display. After F5, transaction pages show
"Wallet session expired. Please reconnect to continue."
Click "Reconnect Wallet", pick the **same** wallet in the modal, and approve.
This guarantees the signer is always bound to the wallet you actually chose.

---

## Test Accounts

### freighter1 (Primary)
- **Address**: `GD4Q2BH6KISIHTZWV5CSUMZC7VUBQAAXPNVSCESTUGH5WEYALMOTRS63`
- **Balance**: 19,931 XLM + 20 USDC
- **Purpose**: Create invoices, test all flows

### Lobstr deployer (Secondary)
- **Address**: `GDJDYADIUAH6CTL5T4JJ72MOQRWYDCNC4GYGJAAG5TM4R5QIAWQ36LEY`
- **Purpose**: Contract deployer, can be used as invoice recipient for testing

---

## Testing Invoice Creation

1. **Connect Freighter** to https://sharpy-sigma.vercel.app
2. **Create Invoice**: Navigate to "New Invoice"
3. **Fill form**:
   - Recipient: `GDJDYADIUAH6CTL5T4JJ72MOQRWYDCNC4GYGJAAG5TM4R5QIAWQ36LEY` (Lobstr deployer)
   - Amount: 5 USDC
   - Deadline: 7 days
4. **Submit** → Freighter popup appears → Approve
5. **Success**: Invoice created, can be viewed/paid

---

## Why Freighter?

| Feature | Freighter | Lobstr | xBull |
|---------|-----------|--------|-------|
| Browser-based signing | ✅ | ❌ (mobile only) | ✅ |
| Testnet support | ✅ | ✅ | ✅ |
| Development UX | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| Instant signing | ✅ | ❌ (phone required) | ✅ |

**Lobstr** is great for production users who want mobile security, but for rapid development/testing, **Freighter is the standard**.

---

## Troubleshooting

**"No wallet connected" error**
- Make sure Freighter is unlocked
- Refresh page and click "Connect Wallet" again

**Transaction fails with insufficient balance**
- Fund account: `stellar keys generate <identity> --network testnet --fund`
- Or use Friendbot: https://friendbot.stellar.org

**Wrong network**
- Check Freighter is on "Testnet" (settings → Network → Testnet)

---

## Contract & Network

| Setting | Value |
|---------|-------|
| Network | testnet |
| Contract | `CAEWQX36RLGP2WY6ACOREDJEIGELYV3HWWUPGV3CJMC27OWGQWZHTH6T` |
| RPC | `https://soroban-testnet.stellar.org` |
| USDC | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` |

If your wallet is on the wrong network (e.g. mainnet), switch it to Testnet
before connecting — otherwise signatures will fail with `txBadAuth`.
