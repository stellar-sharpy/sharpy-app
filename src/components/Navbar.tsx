"use client";
import Link from "next/link";
import { useWallet } from "./WalletProvider";
import { truncateAddress } from "../lib/utils";

export default function Navbar() {
  const { publicKey, connect, disconnect } = useWallet();
  return (
    <nav className="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold text-indigo-600">Sharpy</Link>
      <div className="flex items-center gap-4">
        {publicKey ? (
          <>
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-indigo-600">Dashboard</Link>
            <Link href="/invoice/new" className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700">New Invoice</Link>
            <button onClick={disconnect} className="text-sm text-gray-500 font-mono hover:text-red-500">
              {truncateAddress(publicKey)}
            </button>
          </>
        ) : (
          <button onClick={connect} className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
}
