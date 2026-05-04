const teamModel = require('../models/teamModel');

const listTeams = async (req, res, next) => {
  try {
    const teams = await teamModel.findByManagerId(req.user.id);
    res.json({ data: teams });
  } catch (err) {
    next(err);
  }
};

const createTeam = async (req, res, next) => {
  try {
    const { name, color, logo } = req.body;
    if (!name) return res.status(400).json({ error: 'Team name is required' });

    const team = await teamModel.create({
      name, color, logo, managerId: req.user.id
    });
    res.status(201).json(team);
  } catch (err) {
    next(err);
  }
};

const updateTeam = async (req, res, next) => {
  try {
    const { name, color, logo } = req.body;
    const team = await teamModel.findById(req.params.id);
    
    if (!team) return res.status(404).json({ error: 'Team not found' });
    if (team.managerId !== req.user.id) return res.status(403).json({ error: 'Not authorized to update this team' });

    const updated = await teamModel.update(req.params.id, { name, color, logo });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const deleteTeam = async (req, res, next) => {
  try {
    const team = await teamModel.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    if (team.managerId !== req.user.id) return res.status(403).json({ error: 'Not authorized to delete this team' });

    await teamModel.remove(req.params.id);
    res.json({ message: 'Team deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const addPlayer = async (req, res, next) => {
  try {
    const { name, position, jerseyNumber, userId } = req.body;
    const team = await teamModel.findById(req.params.id);
    
    if (!team) return res.status(404).json({ error: 'Team not found' });
    if (team.managerId !== req.user.id) return res.status(403).json({ error: 'Not authorized to modify this team' });

    if (!name) return res.status(400).json({ error: 'Player name is required' });

    const player = await teamModel.addPlayer({
      teamId: req.params.id, name, position, jerseyNumber, userId
    });
    res.status(201).json(player);
  } catch (err) {
    next(err);
  }
};

const removePlayer = async (req, res, next) => {
  try {
    const team = await teamModel.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    if (team.managerId !== req.user.id) return res.status(403).json({ error: 'Not authorized to modify this team' });

    await teamModel.removePlayer(req.params.playerId);
    res.json({ message: 'Player removed successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { listTeams, createTeam, updateTeam, deleteTeam, addPlayer, removePlayer };
