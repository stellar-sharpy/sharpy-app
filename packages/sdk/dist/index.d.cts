export { A as AuditEntry, B as BatchInvoiceParams, C as CreateInvoiceParams, a as CreateRecurringParams, I as Invoice, R as RecipientAmount, S as SharpyClient, b as SharpyClientConfig, c as SplitRule, d as deadlineFromDays, e as explorerUrl, f as formatAmount, i as isExpired, g as isValidAddress, p as parseAmount, t as truncateAddress } from './index-D7BDmNYX.cjs';

declare class InvoiceNotFoundError extends Error {
    constructor(invoiceId: number);
}
declare class DeadlinePassedError extends Error {
    constructor(invoiceId: number);
}
declare class InvoiceNotPendingError extends Error {
    constructor(invoiceId: number);
}
declare class OverpaymentError extends Error {
    constructor(invoiceId: number);
}

declare function connectWallet(): Promise<string>;
declare function getWalletPublicKey(): Promise<string | null>;
declare function signTransaction(xdr: string, networkPassphrase: string): Promise<string>;

declare const NETWORKS: {
    readonly testnet: {
        readonly rpcUrl: "https://soroban-testnet.stellar.org";
        readonly networkPassphrase: "Test SDF Network ; September 2015";
        readonly contractId: "CBJ7WNBHCO5LKM7LW33D7HUT7WZI5OROVPC7IJL3A6NT6HMVJ4XUWPHJ";
    };
    readonly mainnet: {
        readonly rpcUrl: "https://mainnet.sorobanrpc.com";
        readonly networkPassphrase: "Public Global Stellar Network ; September 2015";
        readonly contractId: "";
    };
};

export { DeadlinePassedError, InvoiceNotFoundError, InvoiceNotPendingError, NETWORKS, OverpaymentError, connectWallet, getWalletPublicKey, signTransaction };
