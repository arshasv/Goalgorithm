import { useState, useEffect, useCallback } from 'react';
import { ScoringService } from '../api/scoringService';
import { TeamService } from '../api/teamService';
import { ScoringConfigService } from '../api/scoringConfigService';
import { ScoresService } from '../api/scoresService';

const DEFAULT_CRITERIA = [
  { name: 'Problem Understanding', max_score: 10 },
  { name: 'Feature Engineering', max_score: 15 },
  { name: 'Team Work', max_score: 10 },
  { name: 'Presentation Quality', max_score: 10 },
  { name: 'Q&A', max_score: 5 },
];

const usePresentationEvaluation = () => {
  const [config, setConfig] = useState(null);
  const [criteria, setCriteria] = useState(DEFAULT_CRITERIA);
  const [teams, setTeams] = useState([]);
  const [evaluations, setEvaluations] = useState({});
  const [results, setResults] = useState(null);
  const [allResults, setAllResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [allJudges, setAllJudges] = useState([]);
  const [selectedJudges, setSelectedJudges] = useState([]);
  const [newJudgeName, setNewJudgeName] = useState('');
  const [newJudgeEmployeeId, setNewJudgeEmployeeId] = useState('');
  const [judgeError, setJudgeError] = useState('');
  const [isSubmittingJudge, setIsSubmittingJudge] = useState(false);

  const [rounds, setRounds] = useState([]);
  const [activeRoundId, setActiveRoundId] = useState(null);
  const [creatingRound, setCreatingRound] = useState(false);
  const [newRoundName, setNewRoundName] = useState('');

  const initData = useCallback(async () => {
    setLoading(true);
    try {
      const activeConfig = await ScoringConfigService.getActiveConfig();
      let criteriaList = [...DEFAULT_CRITERIA];
      if (activeConfig) {
        setConfig(activeConfig);
        if (activeConfig.presentation_criteria) {
          criteriaList = activeConfig.presentation_criteria;
        }
        setCriteria(criteriaList);
      }

      const teamsData = await TeamService.listTeams();
      setTeams(teamsData);

      const judgesData = await ScoringService.listJudges();
      setAllJudges(judgesData);

      const roundsData = await ScoringService.listPresentationRounds();
      setRounds(roundsData);

      const defaultCount = activeConfig?.presentation_judge_count || 2;
      const initialSelected = judgesData.slice(0, Math.min(judgesData.length, defaultCount));
      setSelectedJudges(initialSelected);

      const initialEvals = {};
      teamsData.forEach(t => {
        const teamScores = {};
        initialSelected.forEach(j => {
          const scoreObj = {};
          criteriaList.forEach(c => { scoreObj[c.name] = 0; });
          teamScores[j.id] = scoreObj;
        });
        initialEvals[t.id] = teamScores;
      });
      setEvaluations(initialEvals);

      try {
        const existingEvals = await ScoresService.getPresentationEvaluations(activeRoundId || undefined);
        if (existingEvals && existingEvals.length > 0) {
          const loadedEvals = {};
          const activeJudgesFromScores = [];

          existingEvals.forEach(e => {
            const teamScores = {};
            if (e.judge_scores && e.judge_scores.length > 0) {
              e.judge_scores.forEach(js => {
                if (js.judge_id) {
                  const matchedJudge = judgesData.find(j => j.id === js.judge_id);
                  if (matchedJudge && !activeJudgesFromScores.some(aj => aj.id === matchedJudge.id)) {
                    activeJudgesFromScores.push(matchedJudge);
                  }
                  const scoreObj = {};
                  criteriaList.forEach(c => {
                    scoreObj[c.name] = js.scores?.[c.name] !== undefined
                      ? js.scores[c.name]
                      : (js[c.name] !== undefined ? js[c.name] : 0);
                  });
                  teamScores[js.judge_id] = scoreObj;
                }
              });
            }
            if (Object.keys(teamScores).length > 0) {
              loadedEvals[e.team_id] = teamScores;
            }
          });

          if (Object.keys(loadedEvals).length > 0) {
            setEvaluations(loadedEvals);
            if (activeJudgesFromScores.length > 0) {
              setSelectedJudges(activeJudgesFromScores);
            }
          }
          setResults(existingEvals);
        }
        
        // Also fetch ALL rounds to calculate the final summary
        try {
          const allEvals = await ScoresService.getPresentationEvaluations();
          setAllResults(allEvals || []);
        } catch(e) {
          console.error("Failed to fetch all evaluations", e);
        }
      } catch (err) {
        console.error('Failed to load existing presentation evaluations', err);
      }
    } catch (err) {
      setError('Initialization failed: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }, [activeRoundId]);

  useEffect(() => {
    initData();
  }, [initData]);

  useEffect(() => {
    if (teams.length > 0 && criteria.length > 0) {
      setEvaluations(prev => {
        const next = { ...prev };
        teams.forEach(team => {
          const nextScores = {};
          selectedJudges.forEach(j => {
            const existingScores = prev[team.id]?.[j.id] || {};
            const scoreObj = {};
            criteria.forEach(c => {
              scoreObj[c.name] = existingScores[c.name] !== undefined ? existingScores[c.name] : 0;
            });
            nextScores[j.id] = scoreObj;
          });
          next[team.id] = nextScores;
        });
        return next;
      });
    }
  }, [teams, selectedJudges, criteria]);

  const handleScoreChange = (teamId, judgeId, criterionName, val, maxScore) => {
    const cleanVal = Math.max(0, Math.min(maxScore, val === '' ? 0 : parseFloat(val) || 0));
    setEvaluations(prev => {
      const teamScores = { ...(prev[teamId] || {}) };
      teamScores[judgeId] = {
        ...(teamScores[judgeId] || {}),
        [criterionName]: cleanVal,
      };
      return { ...prev, [teamId]: teamScores };
    });
  };

  const getJudgeTotal = (teamId, judgeId) => {
    const judgeObj = evaluations[teamId]?.[judgeId] || {};
    return Object.values(judgeObj).reduce((sum, val) => sum + (val || 0), 0);
  };

  const getTeamAverage = (teamId) => {
    if (selectedJudges.length === 0) return 0;
    const totalSum = selectedJudges.reduce((sum, j) => sum + getJudgeTotal(teamId, j.id), 0);
    return totalSum / selectedJudges.length;
  };

  const getMaxTotal = () => {
    return criteria.reduce((sum, c) => sum + (c.max_score || 0), 0);
  };

  const handleReset = async () => {
    if (!window.confirm('Reset Presentation Scores?\n\nThis will clear:\n• All judge marks\n• Calculated scores, weighted scores\n• Ranks, grades, and multipliers\n\nTeams, judges, and rounds will NOT be deleted.')) return;
    
    try {
      await ScoringService.resetPresentationScores();
      
      setEvaluations(prev => {
        const next = {};
        Object.keys(prev).forEach(teamId => {
          const teamScores = {};
          Object.keys(prev[teamId]).forEach(judgeId => {
            const resetObj = {};
            Object.keys(prev[teamId][judgeId]).forEach(k => { resetObj[k] = 0; });
            teamScores[judgeId] = resetObj;
          });
          next[teamId] = teamScores;
        });
        return next;
      });
      setResults(null);
      await initData();
    } catch (err) {
      console.error("Failed to reset presentation scores:", err);
      alert("Failed to reset scores on the server.");
    }
  };

  const handleAddJudge = async (e) => {
    e.preventDefault();
    setJudgeError('');
    if (!newJudgeName.trim() || !newJudgeEmployeeId.trim()) {
      setJudgeError('Name and Employee ID are required.');
      return;
    }
    setIsSubmittingJudge(true);
    try {
      const created = await ScoringService.createJudge({
        name: newJudgeName.trim(),
        employee_id: newJudgeEmployeeId.trim(),
      });
      setAllJudges(prev => [...prev, created]);
      setSelectedJudges(prev => [...prev, created]);
      setNewJudgeName('');
      setNewJudgeEmployeeId('');
    } catch (err) {
      setJudgeError(err.response?.data?.detail || err.message || 'Failed to create judge.');
    } finally {
      setIsSubmittingJudge(false);
    }
  };

  const handleDeleteJudge = async (judgeId) => {
    if (!window.confirm('Are you sure you want to delete this judge? All associated scores will be lost.')) return;
    try {
      await ScoringService.deleteJudge(judgeId);
      setAllJudges(prev => prev.filter(j => j.id !== judgeId));
      setSelectedJudges(prev => prev.filter(j => j.id !== judgeId));
    } catch (err) {
      alert('Failed to delete judge: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleToggleSelectJudge = (judge) => {
    setSelectedJudges(prev => {
      const isSelected = prev.some(p => p.id === judge.id);
      if (isSelected) {
        return prev.filter(p => p.id !== judge.id);
      }
      return [...prev, judge];
    });
  };

  const handleSubmitScores = async () => {
    if (selectedJudges.length === 0) {
      alert('Please select at least one active judge before submitting.');
      return;
    }
    if (!window.confirm(`Submit Phase 3 presentation scores evaluated by ${selectedJudges.length} judge(s)?`)) return;
    try {
      const payload = teams.map(t => ({
        team_id: t.id,
        judge_scores: selectedJudges.map(j => ({
          judge_id: j.id,
          scores: evaluations[t.id]?.[j.id] || {},
        })),
      }));
      const response = await ScoringService.calculatePresentation(payload, activeRoundId || undefined);
      setResults(response);
      alert('Presentation scores submitted successfully!');
    } catch (e) {
      alert(`Failed to submit presentation scores: ${e.response?.data?.detail || e.message}`);
    }
  };

  // --- CSV upload support ---
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState(null);

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setCsvUploading(true);
    setCsvResult(null);
    try {
      const result = await ScoringService.uploadPresentationCSV(csvFile, activeRoundId || undefined);
      setCsvResult(result);
      if (result.processed > 0) {
        // Reload all data so the score entry grid and results table refresh
        await initData();
      }
    } catch (err) {
      setCsvResult({
        message: 'Upload failed',
        processed: 0,
        failed: 0,
        errors: [err.response?.data?.detail || err.message || 'Unknown error'],
      });
    } finally {
      setCsvUploading(false);
      setCsvFile(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await ScoringService.downloadPresentationTemplate();
    } catch (err) {
      alert('Failed to download template: ' + (err.message || ''));
    }
  };

  // ------------------------------------------------------------------
  // Round management
  // ------------------------------------------------------------------
  const handleSelectRound = (roundId) => {
    setActiveRoundId(roundId);
  };

  const handleCreateRound = async () => {
    const name = window.prompt('Enter name for the new presentation round:', '');
    if (!name || !name.trim()) return;
    setCreatingRound(true);
    try {
      const created = await ScoringService.createPresentationRound(name.trim());
      setRounds(prev => [...prev, created]);
      setActiveRoundId(created.id);
    } catch (err) {
      alert('Failed to create round: ' + (err.response?.data?.detail || err.message));
    } finally {
      setCreatingRound(false);
    }
  };

  const activeRound = rounds.find(r => r.id === activeRoundId) || null;

  return {
    config,
    criteria,
    teams,
    evaluations,
    results,
    allResults,
    loading,
    error,
    allJudges,
    selectedJudges,
    newJudgeName,
    newJudgeEmployeeId,
    judgeError,
    isSubmittingJudge,
    setNewJudgeName,
    setNewJudgeEmployeeId,
    handleScoreChange,
    getJudgeTotal,
    getTeamAverage,
    getMaxTotal,
    handleReset,
    handleAddJudge,
    handleDeleteJudge,
    handleToggleSelectJudge,
    handleSubmit: handleSubmitScores,
    // CSV upload
    csvFile,
    setCsvFile,
    csvUploading,
    csvResult,
    setCsvResult,
    handleCsvUpload,
    handleDownloadTemplate,
    // Round management
    rounds,
    activeRoundId,
    activeRound,
    handleSelectRound,
    handleCreateRound,
    creatingRound,
  };
};

export default usePresentationEvaluation;
