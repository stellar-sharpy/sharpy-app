export { C as CreateInvoiceParams, a as CreateRecurringParams, I as Invoice, R as RecipientAmount, S as SharpyClient, b as SharpyClientConfig, c as SplitRule, d as deadlineFromDays, e as explorerUrl, f as formatAmount, i as isExpired, g as isValidAddress, p as parseAmount, t as truncateAddress } from './index-BrZvSudU.js';

declare function connectWallet(): Promise<string>;
declare function getWalletPublicKey(): Promise<string | null>;
declare function signTransaction(xdr: string, networkPassphrase: string): Promise<string>;

declare const NETWORKS: {
    readonly testnet: {
        readonly rpcUrl: "https://soroban-testnet.stellar.org";
        readonly networkPassphrase: "Test SDF Network ; September 2015";
        readonly contractId: "CAYTIFPD6RFWVHMK5SPPUUIWWAAANHKOJB6GOAJS5SR5MBKZMEY2UODZ";
    };
    readonly mainnet: {
        readonly rpcUrl: "https://mainnet.sorobanrpc.com";
        readonly networkPassphrase: "Public Global Stellar Network ; September 2015";
        readonly contractId: "";
    };
};

export { NETWORKS, connectWallet, getWalletPublicKey, signTransaction };
