/**
 * Rutas de Citas
 */

const express = require('express');
const router = express.Router();
const CitaController = require('../controllers/citaController');
const { authenticateToken } = require('../middleware/auth');
const { validateCitaReserva, validateCitaConfirmacion, validateCitaId, validateCitaListQuery, validateReservaId } = require('../middleware/validation');

router.get('/', authenticateToken, validateCitaListQuery, CitaController.getCitas);
router.get('/reservas/:idReserva/estado', authenticateToken, validateReservaId, CitaController.getEstadoReserva);
router.get('/:id', authenticateToken, validateCitaId, CitaController.getCitaById);
router.post('/reservar', authenticateToken, validateCitaReserva, CitaController.reservarCita);
router.post('/confirmar', authenticateToken, validateCitaConfirmacion, CitaController.confirmarCita);
router.post('/:id/cancelar', authenticateToken, validateCitaId, CitaController.cancelarCita);
router.post('/:id/confirmar', authenticateToken, validateCitaId, CitaController.marcarConfirmada);
router.post('/:id/no-asistio', authenticateToken, validateCitaId, CitaController.marcarNoAsistio);

module.exports = router;
