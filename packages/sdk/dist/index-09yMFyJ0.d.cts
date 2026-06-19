interface SharpyClientConfig {
    rpcUrl: string;
    networkPassphrase: string;
    contractId: string;
}
interface RecipientAmount {
    address: string;
    amount: bigint;
}
interface CreateInvoiceParams {
    creator: string;
    recipients: RecipientAmount[];
    token: string;
    deadline: number;
    escrowEnabled?: boolean;
    escrowReleaseDelay?: number;
    splitRules?: SplitRule[];
}
interface CreateRecurringParams {
    creator: string;
    recipients: RecipientAmount[];
    token: string;
    deadline: number;
    recurrenceInterval: number;
    maxRecurrences: number;
}
type SplitRule = {
    type: "Fixed";
    amount: bigint;
} | {
    type: "Percentage";
    bps: number;
} | {
    type: "Tiered";
    threshold: bigint;
    bps: number;
};
interface BatchInvoiceParams {
    recipients: RecipientAmount[];
    token: string;
    deadline: number;
}
interface AuditEntry {
    action: string;
    actor: string;
    timestamp: number;
}
interface Invoice {
    id?: number;
    version: number;
    creator: string;
    recipients: string[];
    amounts: bigint[];
    tokens: string[];
    deadline: number;
    funded: bigint;
    status: "Pending" | "Released" | "Refunded" | "Cancelled";
    escrowEnabled: boolean;
    escrowReleaseDelay: number;
    completionTime?: number;
}
declare class SharpyClient {
    private server;
    private config;
    constructor(config: SharpyClientConfig);
    private buildAndSubmit;
    createInvoice(params: CreateInvoiceParams): Promise<{
        invoiceId: number;
        txHash: string;
    }>;
    createRecurring(params: CreateRecurringParams): Promise<{
        invoiceId: number;
        txHash: string;
    }>;
    pay(payer: string, invoiceId: number, amount: bigint): Promise<{
        txHash: string;
    }>;
    releaseEscrow(caller: string, invoiceId: number): Promise<{
        txHash: string;
    }>;
    refund(caller: string, invoiceId: number): Promise<{
        txHash: string;
    }>;
    cancelInvoice(caller: string, invoiceId: number): Promise<{
        txHash: string;
    }>;
    getInvoice(invoiceId: number): Promise<Invoice>;
    createBatch(creator: string, invoices: BatchInvoiceParams[]): Promise<{
        invoiceIds: number[];
        txHash: string;
    }>;
    getAuditLog(invoiceId: number): Promise<AuditEntry[]>;
    getNextRecurring(invoiceId: number): Promise<number | null>;
}

declare function parseAmount(value: string): bigint;
declare function formatAmount(stroops: bigint): string;
declare function deadlineFromDays(days: number): number;
declare function isExpired(deadline: number): boolean;
declare function isValidAddress(address: string): boolean;
declare function truncateAddress(address: string): string;
declare function explorerUrl(network: "testnet" | "mainnet", contractId: string, type?: "contract" | "tx"): string;

export { type AuditEntry as A, type BatchInvoiceParams as B, type CreateInvoiceParams as C, type Invoice as I, type RecipientAmount as R, SharpyClient as S, type CreateRecurringParams as a, type SharpyClientConfig as b, type SplitRule as c, deadlineFromDays as d, explorerUrl as e, formatAmount as f, isValidAddress as g, isExpired as i, parseAmount as p, truncateAddress as t };
