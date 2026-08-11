# Testing Guide — Freighter Flow

**Last Updated**: 2026-08-11  
**Status**: ✅ Ready to test  
**URL**: https://sharpy-sigma.vercel.app

---

## ✅ What's Fixed

1. **SDK no longer has Freighter fallback** — respects configured signer
2. **WalletProvider binds directly to selected wallet** — no race conditions
3. **signerReady flag** — UI prompts reconnect after page refresh
4. **All transaction pages** — check signer state before allowing submission

---

## 🧪 Test Flow

### Prerequisites
1. **Install Freighter** browser extension
2. **Import test account** (`freighter1`):
   ```bash
   # Get the secret key
   cd ~/sharpy-contracts
   stellar keys show freighter1 --network testnet
   ```
   Copy the "Secret key" and import it into Freighter → "Import using secret key"

3. **Switch to Testnet** in Freighter settings

### Test 1: Fresh Connect → Create Invoice
1. Visit https://sharpy-sigma.vercel.app
2. Click "Connect Wallet" → Select "Freighter" → Approve
3. Navigate to "New Invoice"
4. Fill form:
   - Recipient: `GDJDYADIUAH6CTL5T4JJ72MOQRWYDCNC4GYGJAAG5TM4R5QIAWQ36LEY`
   - Amount: 5 USDC
   - Token: USDC (default)
   - Deadline: 7 days
5. Click "Create Invoice"
6. **Expected**: Freighter popup appears with your address `GD4Q2BH6KISIHTZWV5CSUMZC7VUBQAAXPNVSCESTUGH5WEYALMOTRS63`
7. Approve in Freighter
8. **Expected**: Invoice created successfully, redirected to invoice detail page

### Test 2: Page Refresh → Reconnect Flow
1. With wallet still "connected" (address showing in UI), refresh the page (F5)
2. Navigate to "New Invoice"
3. **Expected**: Page shows "Wallet session expired. Please reconnect to continue."
4. Click "Reconnect Wallet" → Select Freighter → Approve
5. Fill form and submit
6. **Expected**: Invoice created successfully

### Test 3: Pay Invoice
1. Navigate to an existing unpaid invoice (or create one first)
2. Click "Pay"
3. Enter amount (e.g., 5 USDC)
4. Click "Pay Invoice"
5. **Expected**: Freighter popup → Approve → Payment successful

---

## 📊 Expected Balances

### freighter1 Account
- **Address**: `GD4Q2BH6KISIHTZWV5CSUMZC7VUBQAAXPNVSCESTUGH5WEYALMOTRS63`
- **XLM**: 19,931 XLM (plenty for fees)
- **USDC**: 20 USDC (enough for multiple test invoices)

### Lobstr deployer (Use as recipient)
- **Address**: `GDJDYADIUAH6CTL5T4JJ72MOQRWYDCNC4GYGJAAG5TM4R5QIAWQ36LEY`
- Can receive payments from test invoices

---

## ❌ What Should NOT Happen

- ❌ Freighter popup showing wrong address (`GA4V...PM3R` or any address you didn't connect with)
- ❌ `txBadAuth` error
- ❌ Lobstr mobile popup (unless you explicitly chose Lobstr in wallet selector)
- ❌ Form submission without wallet popup appearing

---

## 🐛 If Something Breaks

1. **Check Freighter is unlocked** — extension should show your balance
2. **Check network** — Freighter settings → Network → Testnet
3. **Clear session** — Disconnect wallet, refresh page, reconnect
4. **Check browser console** — F12 → Console tab → look for errors
5. **Check account has funds**:
   ```bash
   curl -s "https://horizon-testnet.stellar.org/accounts/GD4Q2BH6KISIHTZWV5CSUMZC7VUBQAAXPNVSCESTUGH5WEYALMOTRS63" | python3 -c "import sys,json; d=json.load(sys.stdin); print([b for b in d['balances'] if b.get('asset_type')=='native'][0]['balance'], 'XLM')"
   ```

---

## 🎯 Success Criteria

✅ Freighter popup shows correct address (`GD4Q2BH6...`)  
✅ Invoice creation succeeds  
✅ After refresh, reconnect prompt appears  
✅ After reconnect, invoices can be created  
✅ Payments work end-to-end  
✅ No unexpected wallet popups  

---

## Next Steps After Testing

1. **Document any issues** encountered
2. **Test multi-recipient invoices** (2-3 recipients)
3. **Test escrow flow** (create with escrow → pay → release)
4. **Test recurring invoices** (create recurring → pay → verify next invoice generated)
5. **Performance test** (create 5-10 invoices quickly)
