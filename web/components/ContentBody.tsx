export default function ContentBody({ text }: { text: string }) {
  return (
    <div className="body-visual-he rounded-lg p-5" style={{ background: "#fff", border: "1px solid var(--color-border)" }}>
      {text}
    </div>
  );
}
