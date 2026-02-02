/**
 * Rutas de Historial Médico
 */

const express = require('express');
const router = express.Router();
const HistorialController = require('../controllers/historialController');
const { validateHistorial, validateHistorialId } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, HistorialController.getAllHistoriales);
router.get('/search', authenticateToken, HistorialController.searchHistoriales);
// Búsqueda avanzada por campos en body JSON
router.post('/search', authenticateToken, HistorialController.getAllHistoriales);
router.get('/stats', authenticateToken, HistorialController.getHistorialStats);
router.get('/:id', authenticateToken, validateHistorialId, HistorialController.getHistorialById);
router.post('/', authenticateToken, validateHistorial, HistorialController.createHistorial);
router.put('/:id', authenticateToken, validateHistorialId, validateHistorial, HistorialController.updateHistorial);
router.delete('/:id', authenticateToken, validateHistorialId, HistorialController.deleteHistorial);

module.exports = router;
