import React from 'react';
import usePresentationEvaluation from '../../hooks/usePresentationEvaluation';

const rankBadge = (rank) => {
  const r = Number(rank);
  if (r === 1) return <span className="rank-badge rank-badge-1">🏆</span>;
  if (r === 2) return <span className="rank-badge rank-badge-2">🥈</span>;
  if (r === 3) return <span className="rank-badge rank-badge-3">🥉</span>;
  return <span className="rank-badge rank-badge-n">#{rank}</span>;
};

const gradeBadge = (grade) => {
  const colors = { A: 'badge-success', B: 'badge-info', C: 'badge-warning' };
  return <span className={`badge ${colors[grade] || 'badge-warning'}`}>Grade {grade}</span>;
};

const formatTeamDisplay = (t) => {
  const code = t.team_code || t.code || t.team_id || t.id || '';
  const name = t.name || t.team_name || '';
  return code ? `${code} – ${name}` : name;
};

const PresentationView = () => {
  const {
    config, criteria, teams, evaluations, results, allResults, loading, error,
    allJudges, selectedJudges, newJudgeName, newJudgeEmployeeId, judgeError, isSubmittingJudge,
    setNewJudgeName, setNewJudgeEmployeeId, handleScoreChange, getJudgeTotal, getTeamAverage, getMaxTotal,
    handleReset, handleAddJudge, handleDeleteJudge, handleToggleSelectJudge, handleSubmit,
    csvFile, setCsvFile, csvUploading, csvResult, setCsvResult, handleCsvUpload, handleDownloadTemplate,
    rounds, activeRoundId, activeRound, handleSelectRound, handleCreateRound, creatingRound,
  } = usePresentationEvaluation();

  if (loading) return <div className="loading-spinner"></div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  const maxTotal = getMaxTotal();

  // Aggregate phase 3 final summary
  const summaryMap = {};
  if (allResults && allResults.length > 0) {
    allResults.forEach(r => {
      if (!summaryMap[r.team_id]) {
        summaryMap[r.team_id] = { team_id: r.team_id, totalWeighted: 0, rounds: [] };
      }
      summaryMap[r.team_id].rounds.push(r);
      summaryMap[r.team_id].totalWeighted += r.weighted_score || 0;
    });
  }

  const uniqueRoundsSet = new Set();
  let hasNullRound = false;
  if (allResults) {
    allResults.forEach(r => {
      if (r.round_id) uniqueRoundsSet.add(r.round_id);
      else hasNullRound = true;
    });
  }
  const completedRoundsCount = Math.max(uniqueRoundsSet.size + (hasNullRound ? 1 : 0), 1);
  const dynamicDenominator = completedRoundsCount * 150;

  const finalSummary = Object.values(summaryMap).map(s => {
    s.finalScore = (s.totalWeighted / dynamicDenominator) * 20;
    return s;
  }).sort((a, b) => b.finalScore - a.finalScore);

  finalSummary.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">🎤 Presentation Evaluation</h1>
          <p className="page-subtitle">Phase 3 · Peer Review · Multi-round Scaling</p>
        </div>
      </div>

      <div className="card section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Presentation Round:</label>
          <select 
            className="form-input" 
            style={{ width: '250px', marginBottom: 0 }}
            value={activeRoundId || ''}
            onChange={(e) => handleSelectRound(e.target.value)}
          >
            <option value="" disabled>Select Round...</option>
            {rounds.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={handleCreateRound} disabled={creatingRound}>
            {creatingRound ? 'Adding...' : '+ Add Round'}
          </button>
        </div>
      </div>

      {!activeRoundId ? (
        <div className="alert alert-info">Please select or create a presentation round to continue.</div>
      ) : (
        <>
          <div className="card section">
            <div className="card-header"><span className="card-title">👥 Judge Settings & Management</span></div>
            <div style={{ display: 'flex', gap: 'var(--space-xl)', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <h4 className="form-label">Register New Judge</h4>
                <form onSubmit={handleAddJudge} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  <input className="form-input" placeholder="Judge Name" value={newJudgeName} onChange={e => setNewJudgeName(e.target.value)} />
                  <input className="form-input" placeholder="Employee ID" value={newJudgeEmployeeId} onChange={e => setNewJudgeEmployeeId(e.target.value)} />
                  {judgeError && <div style={{ color: 'var(--color-status-error)', fontSize: 'var(--text-sm)' }}>{judgeError}</div>}
                  <button type="submit" className="btn btn-secondary" disabled={isSubmittingJudge}>+ Register Judge</button>
                </form>
              </div>
              <div style={{ flex: 2, minWidth: '300px' }}>
                <h4 className="form-label">Active Judges for this Round</h4>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-sm)' }}>Select judges participating in this round. Unselected judges will not appear in the scoring table.</p>
                {allJudges.length === 0 ? (
                  <div className="alert alert-warning">No judges registered in the system.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-sm)' }}>
                    {allJudges.map(j => {
                      const isSelected = selectedJudges.some(s => s.id === j.id);
                      return (
                        <div key={j.id} className="card" style={{ padding: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer', border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)' }} onClick={() => handleToggleSelectJudge(j)}>
                          <input type="checkbox" checked={isSelected} readOnly />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{j.name}</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{j.employee_id}</div>
                          </div>
                          <button className="btn btn-ghost" style={{ padding: '2px 6px', color: 'var(--color-status-error)' }} onClick={(e) => { e.stopPropagation(); handleDeleteJudge(j.id); }}>✕</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card section">
            <div className="card-header"><span className="card-title">📥 Upload Presentation Scores CSV</span></div>
            <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} className="form-input" style={{ flex: 1, marginBottom: 0, padding: 'var(--space-xs)' }} />
              <button className="btn btn-primary" onClick={handleCsvUpload} disabled={!csvFile || csvUploading}>{csvUploading ? 'Uploading...' : 'Upload & Score'}</button>
              <button className="btn btn-secondary" onClick={handleDownloadTemplate}>Download Template</button>
            </div>
            {csvResult && (
              <div className={`alert ${csvResult.failed > 0 ? 'alert-warning' : 'alert-success'}`} style={{ marginTop: 'var(--space-md)' }}>
                <strong>{csvResult.message}</strong> - Processed: {csvResult.processed}, Failed: {csvResult.failed}
                {csvResult.errors && csvResult.errors.length > 0 && (
                  <ul style={{ margin: 'var(--space-sm) 0 0 0', paddingLeft: 'var(--space-md)' }}>
                    {csvResult.errors.map((err, idx) => <li key={idx} style={{ fontSize: 'var(--text-sm)' }}>{err}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="card section">
            <div className="card-header"><span className="card-title">📝 Multi-Judge Score Entry</span></div>
            <div className="table-wrapper">
              <table style={{ minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th style={{ minWidth: '150px' }}>Team</th>
                    {selectedJudges.map(j => (
                      <th key={j.id} className="score-header" style={{ borderLeft: '2px solid var(--color-border)', minWidth: '200px' }}>
                        <div style={{ marginBottom: 'var(--space-sm)' }}>{j.name}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', fontWeight: 'normal', fontSize: 'var(--text-xs)' }}>
                          {criteria.map(c => (
                            <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>{c.name}</span>
                              <span style={{ color: 'var(--color-text-muted)' }}>/{c.max_score}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 'var(--space-xs)', paddingTop: 'var(--space-xs)', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                          <span>Judge Total</span>
                          <span>/{maxTotal}</span>
                        </div>
                      </th>
                    ))}
                    <th className="score-header" style={{ borderLeft: '2px solid var(--color-border)', minWidth: '100px' }}>Raw Average (/50)</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t, i) => {
                    const avg = getTeamAverage(t.id);
                    return (
                      <tr key={t.id} style={{ animation: `fadeIn ${300 + i * 80}ms var(--ease-out) both` }}>
                        <td style={{ fontWeight: 600, fontFamily: 'var(--font-display)', whiteSpace: 'nowrap' }}>{formatTeamDisplay(t)}</td>
                        {selectedJudges.map(j => {
                          const judgeTotal = getJudgeTotal(t.id, j.id);
                          return (
                            <td key={j.id} className="score-cell" style={{ borderLeft: '2px solid var(--color-border)', verticalAlign: 'top' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                                {criteria.map(c => (
                                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-sm)' }}>
                                    <input 
                                      className="form-input score-input" 
                                      type="number" step="0.5" min="0" max={c.max_score}
                                      value={evaluations[t.id]?.[j.id]?.[c.name] ?? ''}
                                      onChange={(e) => handleScoreChange(t.id, j.id, c.name, e.target.value, c.max_score)}
                                      style={{ width: '60px', padding: 'var(--space-xs)', margin: 0, textAlign: 'right' }}
                                    />
                                  </div>
                                ))}
                                <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 'var(--space-xs)', paddingTop: 'var(--space-xs)', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-score)' }}>
                                  {judgeTotal.toFixed(2)}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                        <td className="score-cell" style={{ borderLeft: '2px solid var(--color-border)', verticalAlign: 'middle', textAlign: 'center' }}>
                          <span style={{ fontFamily: 'var(--font-score)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: avg > 0 ? 'var(--color-primary)' : 'inherit' }}>
                            {avg.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 'var(--space-md)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)' }}>
              <button className="btn btn-ghost" onClick={handleReset}>Reset All Presentation Scores</button>
              <button className="btn btn-primary" onClick={handleSubmit}>✓ Calculate & Save Round Scores</button>
            </div>
          </div>

          {results && (
            <div className="card section" style={{ animation: 'slideUp 400ms var(--ease-out)' }}>
              <div className="card-header"><span className="card-title">📊 Phase 3 Results ({activeRound?.name})</span></div>
              <div className="table-wrapper">
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Rank</th><th>Team</th><th className="score-header">Raw /50</th>
                      <th>Grade</th><th className="score-header">Multiplier</th><th className="score-header">Weighted Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => {
                      const t = teams.find(team => team.id === r.team_id) || { name: r.team_id };
                      return (
                        <tr key={r.team_id} className={`rank-${r.rank <= 3 ? r.rank : 'n'}`} style={{ animation: `fadeIn ${400 + i * 80}ms var(--ease-out) both` }}>
                          <td>{rankBadge(r.rank)}</td>
                          <td style={{ fontWeight: 600, fontFamily: 'var(--font-display)' }}>{formatTeamDisplay(t)}</td>
                          <td className="score-cell">{Number(r.raw_total).toFixed(2)}</td>
                          <td>{gradeBadge(r.grade)}</td>
                          <td className="score-cell">{r.multiplier}×</td>
                          <td className="score-cell" style={{ fontWeight: 800, fontSize: 'var(--text-lg)', fontFamily: 'var(--font-score)' }}>
                            {r.weighted_score != null ? Number(r.weighted_score).toFixed(2) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {finalSummary.length > 0 && (
            <div className="card section" style={{ animation: 'slideUp 500ms var(--ease-out)' }}>
              <div className="card-header"><span className="card-title">🏆 Final Phase 3 Summary (All Rounds)</span></div>
              <div className="table-wrapper">
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Rank</th><th>Team</th>
                      {rounds.map(r => (
                        <th key={r.id} className="score-header">{r.name} Weighted</th>
                      ))}
                      <th className="score-header">Total Weighted /{dynamicDenominator}</th>
                      <th className="score-header">Final Phase 3 /20</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalSummary.map((s, i) => {
                      const t = teams.find(team => team.id === s.team_id) || { name: s.team_id };
                      return (
                        <tr key={s.team_id} className={`rank-${s.rank <= 3 ? s.rank : 'n'}`} style={{ animation: `fadeIn ${400 + i * 80}ms var(--ease-out) both` }}>
                          <td>{rankBadge(s.rank)}</td>
                          <td style={{ fontWeight: 600, fontFamily: 'var(--font-display)' }}>{formatTeamDisplay(t)}</td>
                          {rounds.map(r => {
                            const roundEval = s.rounds.find(ev => ev.round_id === r.id);
                            return <td key={r.id} className="score-cell">{(roundEval && roundEval.weighted_score != null) ? Number(roundEval.weighted_score).toFixed(2) : '-'}</td>;
                          })}
                          <td className="score-cell" style={{ fontWeight: 800 }}>{s.totalWeighted.toFixed(2)}</td>
                          <td className="score-cell" style={{ fontWeight: 800, fontSize: 'var(--text-lg)', fontFamily: 'var(--font-score)', color: 'var(--color-primary)' }}>{s.finalScore.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="formula-card section">
            <div className="formula-title">Phase 3 Multi-Round Formula</div>
            <div className="formula-text">
              <strong>1. Round Weighted Score:</strong> Raw Average (/50) × Grade Multiplier<br />
              <strong>2. Final Score (/20):</strong> (Sum of Round Weighted Scores) ÷ {dynamicDenominator} × 20
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PresentationView;
