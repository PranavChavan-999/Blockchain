export default function History({ txHistory }) {
  if (txHistory.length === 0) return null;

  return (
    <div className="history-wrap">
      <div className="section-label">Recent Claims</div>
      {txHistory.map((tx) => (
        <div key={tx.id} className="history-item">
          <div className="history-left">
            <span className="history-emoji">{tx.icon}</span>
            <div>
              <div className="history-skill">{tx.skill}</div>
              <div className="history-time">{tx.time}</div>
              {tx.hash && (
                <div className="history-hash">
                  {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                </div>
              )}
            </div>
          </div>
          <span className="history-badge">CLAIMED</span>
        </div>
      ))}
    </div>
  );
}
