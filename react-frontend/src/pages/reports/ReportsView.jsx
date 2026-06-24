import React, { useState, useEffect } from 'react';
import { ReportService } from '../../api/reportService';
import './Reports.css';

const COLORS = {
  mutedGold: '#D4AF37',
  blue: '#2563EB',
  lightBlue: '#38BDF8',
  white: '#FFFFFF',
  gray: '#94A3B8',
  text: 'var(--text-primary, #FFFFFF)',
  textMuted: 'var(--text-muted, #94A3B8)',
  grid: 'rgba(148, 163, 184, 0.2)'
};

const GroupedBarChart = ({ data, height = 260 }) => {
  if (!data || !data.length) return null;
  const w = 600;
  const padL = 30, padR = 10, padT = 20, padB = 40;
  
  const maxVal = Math.max(...data.map(d => Math.max(d.raw, d.weighted)), 1);
  const chartW = w - padL - padR;
  const chartH = height - padT - padB;
  const groupW = chartW / data.length;
  const barW = Math.min(25, (groupW * 0.8) / 2);

  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: '100%', height: '100%', maxHeight: '280px', overflow: 'visible' }}>
      {[0, 0.5, 1].map(f => {
        const y = padT + (1 - f) * chartH;
        return (
          <g key={f}>
            <line x1={padL} y1={y} x2={w - padR} y2={y} stroke={COLORS.grid} strokeDasharray="4 4" />
            <text x={padL - 8} y={y + 4} textAnchor="end" fill={COLORS.textMuted} fontSize="11">{Math.round(f * maxVal)}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const cx = padL + i * groupW + groupW / 2;
        const hRaw = (d.raw / maxVal) * chartH;
        const yRaw = padT + chartH - hRaw;
        const hWeighted = (d.weighted / maxVal) * chartH;
        const yWeighted = padT + chartH - hWeighted;
        return (
          <g key={i}>
            <rect x={cx - barW - 1} y={yRaw} width={barW} height={hRaw} fill={COLORS.blue} rx="2" />
            <rect x={cx + 1} y={yWeighted} width={barW} height={hWeighted} fill={COLORS.mutedGold} rx="2" />
            <text x={cx} y={height - 20} textAnchor="middle" fill={COLORS.text} fontSize="11" transform={String(d.team).length > 8 ? `rotate(-15, ${cx}, ${height-20})` : ""}>
              {String(d.team).length > 10 ? String(d.team).substring(0, 8) + '...' : d.team}
            </text>
          </g>
        );
      })}
      <g transform={`translate(${w/2 - 60}, 5)`}>
        <rect x={0} y={0} width={10} height={10} fill={COLORS.blue} rx="2"/>
        <text x={14} y={9} fill={COLORS.textMuted} fontSize="11">Raw Score</text>
        <rect x={85} y={0} width={10} height={10} fill={COLORS.mutedGold} rx="2"/>
        <text x={99} y={9} fill={COLORS.textMuted} fontSize="11">Weighted Score</text>
      </g>
    </svg>
  );
};

const ImpactBarChart = ({ data, height = 260 }) => {
  if (!data || !data.length) return null;
  const w = 600;
  const padL = 30, padR = 10, padT = 20, padB = 40;
  
  const maxVal = Math.max(...data.map(d => d.gain), 1);
  const chartW = w - padL - padR;
  const chartH = height - padT - padB;
  const barW = Math.min(30, chartW / data.length * 0.5);
  const maxGain = Math.max(...data.map(d => d.gain));

  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: '100%', height: '100%', maxHeight: '280px', overflow: 'visible' }}>
      {[0, 0.5, 1].map(f => {
        const y = padT + (1 - f) * chartH;
        return (
          <g key={f}>
            <line x1={padL} y1={y} x2={w - padR} y2={y} stroke={COLORS.grid} strokeDasharray="4 4" />
            <text x={padL - 8} y={y + 4} textAnchor="end" fill={COLORS.textMuted} fontSize="11">{Math.round(f * maxVal)}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const cx = padL + i * (chartW / data.length) + (chartW / data.length) / 2;
        const h = (d.gain / maxVal) * chartH;
        const y = padT + chartH - h;
        const isMax = d.gain === maxGain && d.gain > 0;
        return (
          <g key={i}>
            <rect x={cx - barW/2} y={y} width={barW} height={h} fill={isMax ? COLORS.mutedGold : COLORS.blue} rx="2" />
            <text x={cx} y={y - 6} textAnchor="middle" fill={isMax ? COLORS.mutedGold : COLORS.text} fontSize="11" fontWeight="bold">+{d.gain.toFixed(1)}</text>
            <text x={cx} y={height - 20} textAnchor="middle" fill={COLORS.text} fontSize="11" transform={String(d.team).length > 8 ? `rotate(-15, ${cx}, ${height-20})` : ""}>
              {String(d.team).length > 10 ? String(d.team).substring(0, 8) + '...' : d.team}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const StackedBarChart = ({ data, height = 260 }) => {
  if (!data || !data.length) return null;
  const w = 600;
  const padL = 30, padR = 10, padT = 20, padB = 40;
  
  const maxVal = 100;
  const chartW = w - padL - padR;
  const chartH = height - padT - padB;
  const barW = Math.min(30, chartW / data.length * 0.5);

  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: '100%', height: '100%', maxHeight: '280px', overflow: 'visible' }}>
      {[0, 0.25, 0.5, 0.75, 1].map(f => {
        const y = padT + (1 - f) * chartH;
        return (
          <g key={f}>
            <line x1={padL} y1={y} x2={w - padR} y2={y} stroke={COLORS.grid} strokeDasharray="4 4" />
            <text x={padL - 8} y={y + 4} textAnchor="end" fill={COLORS.textMuted} fontSize="11">{Math.round(f * maxVal)}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const cx = padL + i * (chartW / data.length) + (chartW / data.length) / 2;
        const hPred = (d.pred / maxVal) * chartH;
        const hTech = (d.tech / maxVal) * chartH;
        const hPres = (d.pres / maxVal) * chartH;
        
        const yPred = padT + chartH - hPred;
        const yTech = yPred - hTech;
        const yPres = yTech - hPres;

        return (
          <g key={i}>
            <rect x={cx - barW/2} y={yPred} width={barW} height={hPred} fill={COLORS.blue} />
            <rect x={cx - barW/2} y={yTech} width={barW} height={hTech} fill={COLORS.lightBlue} />
            <rect x={cx - barW/2} y={yPres} width={barW} height={hPres} fill={COLORS.mutedGold} />
            <text x={cx} y={yPres - 6} textAnchor="middle" fill={COLORS.text} fontSize="11" fontWeight="bold">{d.final.toFixed(1)}</text>
            <text x={cx} y={height - 20} textAnchor="middle" fill={COLORS.text} fontSize="11" transform={String(d.team).length > 8 ? `rotate(-15, ${cx}, ${height-20})` : ""}>
              {String(d.team).length > 10 ? String(d.team).substring(0, 8) + '...' : d.team}
            </text>
          </g>
        );
      })}
      <g transform={`translate(${w/2 - 120}, 5)`}>
        <rect x={0} y={0} width={10} height={10} fill={COLORS.blue} rx="2"/>
        <text x={14} y={9} fill={COLORS.textMuted} fontSize="11">Prediction</text>
        <rect x={80} y={0} width={10} height={10} fill={COLORS.lightBlue} rx="2"/>
        <text x={94} y={9} fill={COLORS.textMuted} fontSize="11">Technical</text>
        <rect x={155} y={0} width={10} height={10} fill={COLORS.mutedGold} rx="2"/>
        <text x={169} y={9} fill={COLORS.textMuted} fontSize="11">Presentation</text>
      </g>
    </svg>
  );
};

const RankMovementChart = ({ data, height = 260 }) => {
  if (!data || !data.length) return null;
  const w = 600;
  const padL = 30, padR = 10, padT = 20, padB = 40;
  
  const maxMovement = Math.max(...data.map(d => Math.abs(d.movement)), 1);
  const chartW = w - padL - padR;
  const chartH = height - padT - padB;
  const barW = Math.min(30, chartW / data.length * 0.5);
  const midY = padT + chartH / 2;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: '100%', height: '100%', maxHeight: '280px', overflow: 'visible' }}>
      <line x1={padL} y1={midY} x2={w - padR} y2={midY} stroke={COLORS.grid} strokeDasharray="4 4" />
      {data.map((d, i) => {
        const cx = padL + i * (chartW / data.length) + (chartW / data.length) / 2;
        const h = (Math.abs(d.movement) / maxMovement) * (chartH / 2);
        const isPos = d.movement > 0;
        const isNeg = d.movement < 0;
        const y = isPos ? midY - h : midY;
        const fill = isPos ? COLORS.mutedGold : (isNeg ? COLORS.gray : COLORS.lightBlue);

        return (
          <g key={i}>
            <rect x={cx - barW/2} y={y} width={barW} height={h || 2} fill={fill} rx="2" />
            <text x={cx} y={isPos ? y - 6 : midY + h + 14} textAnchor="middle" fill={fill} fontSize="11" fontWeight="bold">
              {d.movement > 0 ? '+' : ''}{d.movement}
            </text>
            <text x={cx} y={isPos ? midY + 12 : midY - 6} textAnchor="middle" fill={COLORS.textMuted} fontSize="10">
              {d.before} → {d.after}
            </text>
            <text x={cx} y={height - 20} textAnchor="middle" fill={COLORS.text} fontSize="11" transform={String(d.team).length > 8 ? `rotate(-15, ${cx}, ${height-20})` : ""}>
              {String(d.team).length > 10 ? String(d.team).substring(0, 8) + '...' : d.team}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const ReportsView = () => {
  const [breakdown, setBreakdown] = useState([]);
  const [multiplierImpact, setMultiplierImpact] = useState([]);
  const [rankAnalysis, setRankAnalysis] = useState([]);
  const [phaseContribution, setPhaseContribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTeam, setExpandedTeam] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const [bdData, miData, raData, pcData] = await Promise.all([
          ReportService.getTeamBreakdown(),
          ReportService.getMultiplierImpact(),
          ReportService.getRankAnalysis(),
          ReportService.getPhaseContribution()
        ]);
        setBreakdown(bdData || []);
        setMultiplierImpact(miData || []);
        setRankAnalysis(raData || []);
        setPhaseContribution(pcData || []);
      } catch (err) {
        setError('Failed to load reports data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return <div className="loading-spinner">Loading reports...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  // Calculate top summaries
  let currentLeader = 'N/A';
  let highestFinalScore = 0;
  if (breakdown.length > 0) {
    const leader = [...breakdown].sort((a, b) => b.final_score - a.final_score)[0];
    if (leader) {
      currentLeader = leader.team_name;
      highestFinalScore = leader.final_score;
    }
  }

  let biggestMultiplierGain = { team: 'N/A', gain: 0 };
  if (multiplierImpact.length > 0) {
    const biggestImpact = [...multiplierImpact].sort((a, b) => b.gain - a.gain)[0];
    if (biggestImpact) biggestMultiplierGain = biggestImpact;
  }

  let biggestRankImprovement = { team: 'N/A', movement: 0 };
  if (rankAnalysis.length > 0) {
    const biggestImprove = [...rankAnalysis].sort((a, b) => b.movement - a.movement)[0];
    if (biggestImprove && biggestImprove.movement > 0) biggestRankImprovement = biggestImprove;
  }

  const toggleExpand = (teamId) => {
    if (expandedTeam === teamId) {
      setExpandedTeam(null);
    } else {
      setExpandedTeam(teamId);
    }
  };

  const chart1Data = multiplierImpact.map(d => ({ team: d.team, raw: d.raw_score, weighted: d.weighted_score }));
  const chart2Data = multiplierImpact.map(d => ({ team: d.team, gain: d.gain }));
  const chart3Data = phaseContribution.map(d => ({ team: d.team, pred: d.prediction_contribution, tech: d.technical_contribution, pres: d.presentation_contribution, final: d.final_score }));
  const chart4Data = rankAnalysis.map(d => ({ team: d.team, before: d.raw_rank, after: d.final_rank, movement: d.movement }));

  const handleExportCSV = () => {
    const headers = [
      'Team', 'Prediction Raw', 'Prediction Normalized', 'Technical Raw', 
      'Technical Normalized', 'Presentation Rounds', 'Grades', 
      'Multipliers', 'Weighted Scores', 'Final Score'
    ];
    
    const rows = breakdown.map(team => {
      const pRounds = team.presentation.rounds.map(r => r.round_name).join(' | ');
      const pGrades = team.presentation.rounds.map(r => r.grade || 'N/A').join(' | ');
      const pMults = team.presentation.rounds.map(r => r.multiplier || 1).join(' | ');
      const pWeights = team.presentation.rounds.map(r => r.weighted_score.toFixed(2)).join(' | ');

      return [
        `"${team.team_name}"`,
        team.phase1.raw_score.toFixed(2),
        team.phase1.normalized_score.toFixed(2),
        team.technical.raw_score.toFixed(2),
        team.technical.normalized_score.toFixed(2),
        `"${pRounds}"`,
        `"${pGrades}"`,
        `"${pMults}"`,
        `"${pWeights}"`,
        team.final_score.toFixed(2)
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "score_reports.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    
    let html = `
      <html>
        <head>
          <title>Competition Report</title>
          <style>
            body { font-family: sans-serif; color: #333; padding: 20px; }
            h1, h2 { color: #0F172A; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f1f5f9; }
          </style>
        </head>
        <body>
          <h1>Competition Score Report</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
          
          <h2>Final Leaderboard & Score Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Team</th>
                <th>Pred. (Raw / Norm)</th>
                <th>Tech. (Raw / Norm)</th>
                <th>Pres. (Norm)</th>
                <th>Final Score</th>
              </tr>
            </thead>
            <tbody>
              ${[...breakdown].sort((a,b) => b.final_score - a.final_score).map(t => `
                <tr>
                  <td>${t.team_name}</td>
                  <td>${t.phase1.raw_score.toFixed(1)} / ${t.phase1.normalized_score.toFixed(1)}</td>
                  <td>${t.technical.raw_score.toFixed(1)} / ${t.technical.normalized_score.toFixed(1)}</td>
                  <td>${t.presentation.normalized_score.toFixed(1)}</td>
                  <td><strong>${t.final_score.toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2>Multiplier Explanation</h2>
          <table>
            <thead>
              <tr>
                <th>Team</th>
                <th>Grade</th>
                <th>Multiplier</th>
                <th>Raw Score</th>
                <th>Weighted Score</th>
                <th>Gain</th>
              </tr>
            </thead>
            <tbody>
              ${multiplierImpact.map(m => `
                <tr>
                  <td>${m.team}</td>
                  <td>${m.grade || 'N/A'}</td>
                  <td>x${m.multiplier || 1}</td>
                  <td>${m.raw_score.toFixed(2)}</td>
                  <td>${m.weighted_score.toFixed(2)}</td>
                  <td style="color: green;">+${m.gain.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h2>Phase Contribution</h2>
          <table>
            <thead>
              <tr>
                <th>Team</th>
                <th>Prediction</th>
                <th>Technical</th>
                <th>Presentation</th>
                <th>Final</th>
              </tr>
            </thead>
            <tbody>
              ${phaseContribution.map(p => `
                <tr>
                  <td>${p.team}</td>
                  <td>${p.prediction_contribution.toFixed(2)}</td>
                  <td>${p.technical_contribution.toFixed(2)}</td>
                  <td>${p.presentation_contribution.toFixed(2)}</td>
                  <td>${p.final_score.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="reports-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>📑 Score Reports & Analysis</h1>
          <p>Transparency into the scoring pipeline and transformations.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>Export CSV</button>
          <button className="btn btn-primary" onClick={handleExportPDF}>Export PDF</button>
        </div>
      </div>

      <div className="dashboard-grid stats-grid">
        <div className="card stat-card">
          <div className="stat-label">Current Leader</div>
          <div className="stat-value text-gold">{currentLeader}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Highest Final Score</div>
          <div className="stat-value text-blue">{highestFinalScore} / 100</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Biggest Multiplier Gain</div>
          <div className="stat-value text-gold">
            {biggestMultiplierGain.team} (+{biggestMultiplierGain.gain.toFixed(2)})
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Biggest Rank Improvement</div>
          <div className="stat-value text-blue">
            {biggestRankImprovement.team} (+{biggestRankImprovement.movement} ranks)
          </div>
        </div>
      </div>

      <div className="section-header mt-4">
        <h2>Visual Analysis</h2>
        <p>Charts mapping transformations across scoring phases.</p>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-header" style={{ padding: '16px' }}>
            <h3 className="card-title">Before vs After Scoring</h3>
          </div>
          <div className="card-body" style={{ padding: '0 16px 16px' }}>
            <GroupedBarChart data={chart1Data} height={260} />
          </div>
        </div>
        <div className="card">
          <div className="card-header" style={{ padding: '16px' }}>
            <h3 className="card-title">Multiplier Impact</h3>
          </div>
          <div className="card-body" style={{ padding: '0 16px 16px' }}>
            <ImpactBarChart data={chart2Data} height={260} />
          </div>
        </div>
        <div className="card">
          <div className="card-header" style={{ padding: '16px' }}>
            <h3 className="card-title">Phase Contribution</h3>
          </div>
          <div className="card-body" style={{ padding: '0 16px 16px' }}>
            <StackedBarChart data={chart3Data} height={260} />
          </div>
        </div>
        <div className="card">
          <div className="card-header" style={{ padding: '16px' }}>
            <h3 className="card-title">Rank Movement</h3>
          </div>
          <div className="card-body" style={{ padding: '0 16px 16px' }}>
            <RankMovementChart data={chart4Data} height={260} />
          </div>
        </div>
      </div>

      <div className="section-header mt-4">
        <h2>Team Score Journey</h2>
        <p>Expand a team to see how raw scores translate to the final score.</p>
      </div>

      <div className="score-journey-list">
        {breakdown.map((team) => {
          const uniqueRounds = Array.from(new Map(team.presentation.rounds.map(r => [r.round_name, r])).values());
          return (
            <div key={team.team_id} className={`card journey-card ${expandedTeam === team.team_id ? 'expanded' : ''}`} style={{ padding: '0', overflow: 'hidden', marginBottom: '16px' }}>
              <div className="journey-card-header" onClick={() => toggleExpand(team.team_id)} style={{ padding: '16px', cursor: 'pointer', background: 'var(--color-surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: 'var(--color-text-primary)' }}>🏆 {team.team_name}</h3>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <span><strong style={{color: COLORS.mutedGold}}>Final Score: {team.final_score.toFixed(1)} /100</strong></span>
                      <span>Prediction: {team.phase1.normalized_score.toFixed(1)}/20</span>
                      <span>Technical: {team.technical.normalized_score.toFixed(1)}/20</span>
                      <span>Presentation: {team.presentation.normalized_score.toFixed(1)}/20</span>
                    </div>
                  </div>
                  <div style={{ color: COLORS.blue, fontSize: '0.85rem', fontWeight: 'bold' }}>
                    {expandedTeam === team.team_id ? 'Hide Breakdown ▲' : 'View Breakdown ▼'}
                  </div>
                </div>
              </div>

              {expandedTeam === team.team_id && (
                <div className="journey-card-body" style={{ padding: '24px 16px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-secondary)' }}>
                  
                  {/* Prediction Phase */}
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ color: COLORS.text, margin: '0 0 4px 0' }}>1️⃣ Prediction Phase</h4>
                    <p style={{ fontSize: '0.8rem', color: COLORS.gray, margin: '0 0 12px 0' }}>AI prediction scores are scaled to 20 marks</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--color-surface)', padding: '16px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: COLORS.textMuted }}>Original Score:</span>
                        <strong style={{ color: COLORS.blue }}>{team.phase1.raw_score.toFixed(2)} / {team.phase1.max_raw} marks</strong>
                      </div>
                      <div style={{ textAlign: 'center', color: COLORS.gray, fontSize: '0.9rem', margin: '4px 0' }}>
                        ↓ Converted to final weight
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '8px' }}>
                        <span style={{ color: COLORS.textMuted }}>Leaderboard Contribution:</span>
                        <strong style={{ color: COLORS.mutedGold }}>{team.phase1.normalized_score.toFixed(2)} / {team.phase1.max_normalized} marks</strong>
                      </div>
                    </div>
                  </div>

                  {/* Technical Phase */}
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ color: COLORS.text, margin: '0 0 4px 0' }}>2️⃣ Technical Evaluation</h4>
                    <p style={{ fontSize: '0.8rem', color: COLORS.gray, margin: '0 0 12px 0' }}>Technical evaluation is scaled to 20 marks</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--color-surface)', padding: '16px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: COLORS.textMuted }}>Original Score:</span>
                        <strong style={{ color: COLORS.blue }}>{team.technical.raw_score.toFixed(2)} / {team.technical.max_raw} marks</strong>
                      </div>
                      <div style={{ textAlign: 'center', color: COLORS.gray, fontSize: '0.9rem', margin: '4px 0' }}>
                        ↓ Converted Score
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '8px' }}>
                        <span style={{ color: COLORS.textMuted }}>Leaderboard Contribution:</span>
                        <strong style={{ color: COLORS.mutedGold }}>{team.technical.normalized_score.toFixed(2)} / 20 marks</strong>
                      </div>
                    </div>
                  </div>

                  {/* Presentation Phase */}
                  <div>
                    <h4 style={{ color: COLORS.text, margin: '0 0 4px 0' }}>3️⃣ Presentation Evaluation</h4>
                    <p style={{ fontSize: '0.8rem', color: COLORS.gray, margin: '0 0 12px 0' }}>Judge scores receive grade multipliers before scaling</p>
                    
                    <div style={{ background: 'var(--color-surface)', padding: '16px', borderRadius: '8px' }}>
                      {uniqueRounds.map((round, idx) => (
                        <div key={idx} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
                          <h5 style={{ color: COLORS.text, margin: '0 0 8px 0', fontSize: '1rem' }}>{round.round_name}:</h5>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: COLORS.textMuted }}>Judge Average:</span>
                            <strong style={{ color: COLORS.blue }}>{round.raw_score.toFixed(2)} / 50</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: COLORS.textMuted }}>Grade:</span>
                            <strong style={{ color: COLORS.text }}>{round.grade || 'C'}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: COLORS.textMuted }}>Multiplier Applied:</span>
                            <strong style={{ color: COLORS.text }}>×{round.multiplier || 1}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: COLORS.textMuted }}>After Multiplier:</span>
                            <strong style={{ color: COLORS.mutedGold }}>{round.weighted_score.toFixed(2)} / {round.max_weighted}</strong>
                          </div>
                        </div>
                      ))}
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: COLORS.textMuted }}>Combined Presentation:</span>
                          <strong style={{ color: COLORS.blue }}>{team.presentation.total_weighted.toFixed(2)} / {team.presentation.total_possible_weighted}</strong>
                        </div>
                        <div style={{ textAlign: 'center', color: COLORS.gray, fontSize: '0.9rem', margin: '4px 0' }}>
                          ↓ Converted Score
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '8px' }}>
                          <span style={{ color: COLORS.textMuted }}>Leaderboard Contribution:</span>
                          <strong style={{ color: COLORS.mutedGold }}>{team.presentation.normalized_score.toFixed(2)} / 20</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </div>
              )}
            </div>
          );
        })}
        {breakdown.length === 0 && !loading && (
          <div className="empty-state">No score data available yet.</div>
        )}
      </div>
    </div>
  );
};

export default ReportsView;
