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
    /** Creates a single invoice with split rules and escrow options.
     * @param params Invoice creation parameters including recipients, token, deadline, and options
     * @returns Invoice ID and transaction hash
     */
    createInvoice(params: CreateInvoiceParams): Promise<{
        invoiceId: number;
        txHash: string;
    }>;
    /** Creates a recurring invoice that auto-generates the next invoice on release.
     * @param params Recurring invoice parameters including interval and max recurrences
     * @returns Invoice ID and transaction hash
     */
    createRecurring(params: CreateRecurringParams): Promise<{
        invoiceId: number;
        txHash: string;
    }>;
    /** Pays toward a single invoice.
     * @param payer Payer address (must sign)
     * @param invoiceId Target invoice ID
     * @param amount Amount in stroops (bigint)
     * @returns Transaction hash
     */
    pay(payer: string, invoiceId: number, amount: bigint): Promise<{
        txHash: string;
    }>;
    /** Releases escrow-held funds once the delay period has passed.
     * @param caller Caller address
     * @param invoiceId Invoice ID with escrow enabled
     */
    releaseEscrow(caller: string, invoiceId: number): Promise<{
        txHash: string;
    }>;
    /** Refunds all payers after deadline has passed and invoice is not fully funded.
     * @param caller Any address can trigger the refund
     * @param invoiceId Invoice ID that has passed its deadline
     */
    refund(caller: string, invoiceId: number): Promise<{
        txHash: string;
    }>;
    /** Cancels an invoice and refunds all payments. Only the creator can cancel.
     * @param caller Creator address
     * @param invoiceId Invoice ID to cancel
     */
    /** Cancels an invoice and refunds all payments. Only the creator can cancel.
     * @param caller Creator address
     * @param invoiceId Invoice ID to cancel
     */
    cancelInvoice(caller: string, invoiceId: number): Promise<{
        txHash: string;
    }>;
    /** Fetches full invoice state by ID.
     * @param invoiceId Invoice ID to fetch
     * @throws InvoiceNotFoundError if the invoice does not exist
     */
    getInvoice(invoiceId: number): Promise<Invoice>;
    /** Creates up to 10 invoices in a single transaction.
     * @param creator Creator address
     * @param invoices Array of invoice parameters (max 10)
     * @returns Array of invoice IDs and transaction hash
     */
    createBatch(creator: string, invoices: BatchInvoiceParams[]): Promise<{
        invoiceIds: number[];
        txHash: string;
    }>;
    /** Fetches the full audit trail for an invoice.
     * @param invoiceId Invoice ID
     * @returns Array of audit entries with action, actor, and timestamp
     */
    getAuditLog(invoiceId: number): Promise<AuditEntry[]>;
    /** Returns the next invoice ID in a recurring chain, or null if none.
     * @param invoiceId Current invoice ID
     */
    getNextRecurring(invoiceId: number): Promise<number | null>;
    /** Pays toward multiple invoices in a single transaction. All invoices must use the same token.
     * @param payer Payer address (must sign)
     * @param payments Array of { invoiceId, amount } pairs
     * @returns Transaction hash
     */
    poolPay(payer: string, payments: {
        invoiceId: number;
        amount: bigint;
    }[]): Promise<{
        txHash: string;
    }>;
    /** Returns the total amount paid toward an invoice by a specific address.
     * @param invoiceId Invoice ID
     * @param payer Payer address to query
     * @returns Total paid in stroops
     */
    getPayerTotal(invoiceId: number, payer: string): Promise<bigint>;
    /** Returns funding stats for an invoice: funded, total, payment_count, unique_payers, completion_bps.
     * @param invoiceId Invoice ID
     */
    getInvoiceStats(invoiceId: number): Promise<{
        funded: bigint;
        total: bigint;
        paymentCount: number;
        uniquePayers: number;
        completionBps: number;
    }>;
}

declare function parseAmount(value: string): bigint;
declare function formatAmount(stroops: bigint): string;
declare function deadlineFromDays(days: number): number;
declare function isExpired(deadline: number): boolean;
declare function isValidAddress(address: string): boolean;
declare function truncateAddress(address: string): string;
declare function explorerUrl(network: "testnet" | "mainnet", contractId: string, type?: "contract" | "tx"): string;

export { type AuditEntry as A, type BatchInvoiceParams as B, type CreateInvoiceParams as C, type Invoice as I, type RecipientAmount as R, SharpyClient as S, type CreateRecurringParams as a, type SharpyClientConfig as b, type SplitRule as c, deadlineFromDays as d, explorerUrl as e, formatAmount as f, isValidAddress as g, isExpired as i, parseAmount as p, truncateAddress as t };
