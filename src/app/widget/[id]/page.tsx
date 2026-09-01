import SharpyButton from "../../../components/SharpyButton";

export default function WidgetPage({ params, searchParams }: { params: { id: string }, searchParams: { label?: string; amount?: string; theme?: string; size?: string } }) {
  const invoiceId = Number(params.id);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "transparent" }}>
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
