import SharpyButton from "../../../components/SharpyButton";

export async function generateMetadata({ params }: { params: { id: string } }) {
  return { title: `Pay invoice #${params.id} — Sharpy widget` };
}

export default function WidgetPage({ params, searchParams }: { params: { id: string }, searchParams: { label?: string; amount?: string; theme?: string; size?: string } }) {
  const invoiceId = Number(params.id);
  return (
    <div
      style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "transparent" }}
      title={`Sharpy pay button for invoice #${params.id}`}
    >
      <span className="sr-only">Pay invoice #{params.id} via Sharpy — opens the payment page</span>
      <SharpyButton
        invoiceId={invoiceId}
        label={searchParams.label}
        amount={searchParams.amount}
        theme={(searchParams.theme as any) ?? "auto"}
        size={(searchParams.size as any) ?? "md"}
      />
    </div>
  );
}
