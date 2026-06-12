/* Shared Demo/Mock Data — used when backend returns empty results */

const DEMO_MODE = true;

const MockData = {
  teams: [
    { id: '10000001-0000-0000-0000-000000000001', name: 'Team A', code: 'A', team_leader_name: 'Alice Johnson', registered_at: '2026-05-15T10:00:00Z', is_active: true, is_csv_managed: true, members: [
      { id: 'm-001', team_id: '10000001-0000-0000-0000-000000000001', name: 'Bob Smith', employee_id: 'EMP001', created_at: '2026-05-15T10:05:00Z' },
      { id: 'm-002', team_id: '10000001-0000-0000-0000-000000000001', name: 'Carol Lee', employee_id: 'EMP002', created_at: '2026-05-15T10:05:00Z' },
    ]},
    { id: '10000001-0000-0000-0000-000000000002', name: 'Team B', code: 'B', team_leader_name: 'David Chen', registered_at: '2026-05-16T09:00:00Z', is_active: true, is_csv_managed: false, members: [] },
    { id: '10000001-0000-0000-0000-000000000003', name: 'Team C', code: 'C', team_leader_name: 'Eve Williams', registered_at: '2026-05-17T14:00:00Z', is_active: true, is_csv_managed: false, members: [] },
    { id: '10000001-0000-0000-0000-100000000004', name: 'Team D', code: 'D', team_leader_name: 'Frank Brown', registered_at: '2026-05-18T11:00:00Z', is_active: true, is_csv_managed: false, members: [] },
    { id: '10000001-0000-0000-0000-000000000005', name: 'Team E', code: 'E', team_leader_name: 'Grace Davis', registered_at: '2026-05-19T16:00:00Z', is_active: false, is_csv_managed: false, members: [] },
  ],

  matches: [
    { id: 'M32', home: 'Arsenal', away: 'Chelsea', date: 'Jun 10', status: 'scored', predictions: 5, homeGoals: 2, awayGoals: 1 },
    { id: 'M31', home: 'Liverpool', away: 'Man City', date: 'Jun 8', status: 'completed', predictions: 4, homeGoals: 1, awayGoals: 1 },
    { id: 'M30', home: 'Tottenham', away: 'Man Utd', date: 'Jun 6', status: 'frozen', predictions: 3, homeGoals: null, awayGoals: null },
    { id: 'M29', home: 'Everton', away: 'Newcastle', date: 'Jun 4', status: 'scheduled', predictions: 0, homeGoals: null, awayGoals: null },
  ],

  predictions: [
    {
      id: 'pred-001',
      team_id: '10000001-0000-0000-0000-000000000001',
      match_id: 'M32',
      submission_id: 'sub-001',
      idempotency_key: 'idem-001',
      status: 'VALIDATED',
      submitted_at: '2026-06-09T14:32:00Z',
      match_prediction: {
        predicted_winner: 'home',
        predicted_scoreline: {
          home_team_goals: 2,
          away_team_goals: 1
        },
        probabilities: {
          home_win_probability: 65.0,
          draw_probability: 20.0,
          away_win_probability: 15.0
        },
        clean_sheet_probability: {
          home_team: 35.0,
          away_team: 25.0
        },
        first_goal_team: 'home',
        both_teams_to_score_probability: 45.0,
        total_goals_prediction: 3,
        goal_scorers: {
          home: ['Martin Ødegaard', 'Bukayo Saka'],
          away: ['Enzo Fernández']
        }
      }
    },
    {
      id: 'pred-002',
      team_id: '10000001-0000-0000-0000-000000000002',
      match_id: 'M32',
      submission_id: 'sub-002',
      idempotency_key: 'idem-002',
      status: 'VALIDATED',
      submitted_at: '2026-06-09T15:00:00Z',
      match_prediction: {
        predicted_winner: 'draw',
        predicted_scoreline: {
          home_team_goals: 1,
          away_team_goals: 1
        },
        probabilities: {
          home_win_probability: 30.0,
          draw_probability: 40.0,
          away_win_probability: 30.0
        },
        clean_sheet_probability: {
          home_team: 30.0,
          away_team: 30.0
        },
        first_goal_team: null,
        both_teams_to_score_probability: 60.0,
        total_goals_prediction: 2,
        goal_scorers: {
          home: ['Martin Ødegaard'],
          away: ['Enzo Fernández']
        }
      }
    },
    {
      id: 'pred-003',
      team_id: '10000001-0000-0000-0000-000000000003',
      match_id: 'M32',
      submission_id: 'sub-003',
      idempotency_key: 'idem-003',
      status: 'PENDING_VALIDATION',
      submitted_at: '2026-06-09T16:15:00Z',
      match_prediction: {
        predicted_winner: 'away',
        predicted_scoreline: {
          home_team_goals: 0,
          away_team_goals: 2
        },
        probabilities: {
          home_win_probability: 25.0,
          draw_probability: 25.0,
          away_win_probability: 50.0
        },
        clean_sheet_probability: {
          home_team: 20.0,
          away_team: 40.0
        },
        first_goal_team: 'away',
        both_teams_to_score_probability: 30.0,
        total_goals_prediction: 2,
        goal_scorers: {
          home: [],
          away: ['Enzo Fernández', 'Nicolas Jackson']
        }
      }
    },
    {
      id: 'pred-004',
      team_id: '10000001-0000-0000-0000-000000000004',
      match_id: 'M32',
      submission_id: 'sub-004',
      idempotency_key: 'idem-004',
      status: 'VALIDATED',
      submitted_at: '2026-06-09T17:00:00Z',
      match_prediction: {
        predicted_winner: 'home',
        predicted_scoreline: {
          home_team_goals: 3,
          away_team_goals: 0
        },
        probabilities: {
          home_win_probability: 55.0,
          draw_probability: 30.0,
          away_win_probability: 15.0
        },
        clean_sheet_probability: {
          home_team: 45.0,
          away_team: 15.0
        },
        first_goal_team: 'home',
        both_teams_to_score_probability: 25.0,
        total_goals_prediction: 3,
        goal_scorers: {
          home: ['Martin Ødegaard', 'Bukayo Saka', 'Declan Rice'],
          away: []
        }
      }
    },
    {
      id: 'pred-005',
      team_id: '10000001-0000-0000-0000-000000000005',
      match_id: 'M32',
      submission_id: 'sub-005',
      idempotency_key: 'idem-005',
      status: 'PENDING_VALIDATION',
      submitted_at: '2026-06-09T18:00:00Z',
      match_prediction: {
        predicted_winner: 'home',
        predicted_scoreline: {
          home_team_goals: 2,
          away_team_goals: 0
        },
        probabilities: {
          home_win_probability: 60.0,
          draw_probability: 25.0,
          away_win_probability: 15.0
        },
        clean_sheet_probability: {
          home_team: 50.0,
          away_team: 20.0
        },
        first_goal_team: 'home',
        both_teams_to_score_probability: 35.0,
        total_goals_prediction: 2,
        goal_scorers: {
          home: ['Martin Ødegaard', 'Bukayo Saka'],
          away: []
        }
      }
    },
    {
      id: 'pred-006',
      team_id: '10000001-0000-0000-0000-000000000001',
      match_id: 'M31',
      submission_id: 'sub-006',
      idempotency_key: 'idem-006',
      status: 'VALIDATED',
      submitted_at: '2026-06-07T10:00:00Z',
      match_prediction: {
        predicted_winner: 'away',
        predicted_scoreline: {
          home_team_goals: 0,
          away_team_goals: 2
        },
        probabilities: {
          home_win_probability: 30.0,
          draw_probability: 25.0,
          away_win_probability: 45.0
        },
        clean_sheet_probability: {
          home_team: 25.0,
          away_team: 35.0
        },
        first_goal_team: 'away',
        both_teams_to_score_probability: 40.0,
        total_goals_prediction: 2,
        goal_scorers: {
          home: [],
          away: ['Erling Haaland', 'Kevin De Bruyne']
        }
      }
    },
    {
      id: 'pred-007',
      team_id: '10000001-0000-0000-0000-000000000002',
      match_id: 'M31',
      submission_id: 'sub-007',
      idempotency_key: 'idem-007',
      status: 'VALIDATED',
      submitted_at: '2026-06-07T11:00:00Z',
      match_prediction: {
        predicted_winner: 'home',
        predicted_scoreline: {
          home_team_goals: 2,
          away_team_goals: 1
        },
        probabilities: {
          home_win_probability: 50.0,
          draw_probability: 30.0,
          away_win_probability: 20.0
        },
        clean_sheet_probability: {
          home_team: 35.0,
          away_team: 20.0
        },
        first_goal_team: 'home',
        both_teams_to_score_probability: 55.0,
        total_goals_prediction: 3,
        goal_scorers: {
          home: ['Mohamed Salah', 'Luis Díaz'],
          away: ['Erling Haaland']
        }
      }
    },
    {
      id: 'pred-008',
      team_id: '10000001-0000-0000-0000-000000000003',
      match_id: 'M31',
      submission_id: 'sub-008',
      idempotency_key: 'idem-008',
      status: 'INVALID',
      submitted_at: '2026-06-07T12:00:00Z',
      match_prediction: {
        predicted_winner: 'draw',
        predicted_scoreline: {
          home_team_goals: 1,
          away_team_goals: 1
        },
        probabilities: {
          home_win_probability: 35.0,
          draw_probability: 35.0,
          away_win_probability: 30.0
        },
        clean_sheet_probability: {
          home_team: 30.0,
          away_team: 30.0
        },
        first_goal_team: null,
        both_teams_to_score_probability: 65.0,
        total_goals_prediction: 2,
        goal_scorers: {
          home: ['Mohamed Salah'],
          away: ['Erling Haaland']
        }
      }
    }
  ],

  leaderboard: [
    { team_id: '10000001-0000-0000-0000-000000000001', rank: 1, phase1_score: 42.5, technical_score: 18.0, presentation_score: 16.5, final_score: 77.0 },
    { team_id: '10000001-0000-0000-0000-000000000002', rank: 2, phase1_score: 38.2, technical_score: 17.5, presentation_score: 15.0, final_score: 70.7 },
    { team_id: '10000001-0000-0000-0000-000000000003', rank: 3, phase1_score: 35.0, technical_score: 16.0, presentation_score: 14.5, final_score: 65.5 },
    { team_id: '10000001-0000-0000-0000-000000000004', rank: 4, phase1_score: 30.1, technical_score: 15.0, presentation_score: 13.0, final_score: 58.1 },
    { team_id: '10000001-0000-0000-0000-000000000005', rank: 5, phase1_score: 28.0, technical_score: 14.5, presentation_score: 12.0, final_score: 54.5 },
  ],

  async getTeams() {
    try {
      const data = await TeamService.listTeams();
      if (data.length > 0) return data;
    } catch (_) {}
    if (DEMO_MODE) return this.teams;
    return [];
  },

  async getLeaderboard() {
    try {
      const data = await LeaderboardService.get();
      if (data.length > 0) return data;
    } catch (_) {}
    if (DEMO_MODE) return this.leaderboard;
    return [];
  },

  async getPredictions() {
    try {
      const data = await PredictionService.list();
      if (data.length > 0) return data;
    } catch (_) {}
    if (DEMO_MODE) return this.predictions;
    return [];
  },
};
