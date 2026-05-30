import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center text-center py-20 gap-6">
      <h1 className="text-5xl font-bold text-gray-900">Split payments,<br />on-chain.</h1>
      <p className="text-xl text-gray-500 max-w-lg">
        Sharpy lets you create recurring invoices, escrow-protected payments, and flexible multi-recipient splits — all on Stellar.
      </p>
      <div className="flex gap-4 mt-4">
        <Link href="/invoice/new" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700">
          Create Invoice
        </Link>
        <Link href="/dashboard" className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-100">
          View Dashboard
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-6 mt-16 text-left w-full max-w-3xl">
        {[
          { title: "Recurring Splits", desc: "Auto-generate the next invoice on release. Perfect for subscriptions." },
          { title: "Escrow Protection", desc: "Hold funds with a configurable delay before distribution." },
          { title: "Batch Operations", desc: "Create or pay up to 10 invoices in a single transaction." },
        ].map((f) => (
          <div key={f.title} className="bg-white rounded-xl p-5 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
            <p className="text-sm text-gray-500">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
