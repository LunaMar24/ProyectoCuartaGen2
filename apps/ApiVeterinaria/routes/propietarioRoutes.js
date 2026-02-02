/**
 * Rutas de Propietarios
 * @description Define todas las rutas REST para la gestión de propietarios
 */

const express = require('express');
const router = express.Router();
const PropietarioController = require('../controllers/propietarioController');
const { validatePropietario, validatePropietarioId } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route GET /propietarios
 * @description Obtiene todos los propietarios con paginación opcional
 * @access Public
 */
router.get('/', authenticateToken, PropietarioController.getAllPropietarios);

/**
 * @route GET /propietarios/search
 * @description Busca propietarios por nombre o apellidos
 * @access Public
 */
router.get('/search', authenticateToken, PropietarioController.searchPropietarios);

/**
 * @route POST /propietarios/search
 * @description Búsqueda avanzada por campos en el cuerpo (JSON)
 *              Si el body incluye campos específicos (nombre, apellidos, cedula, telefono, correo)
 *              se usa búsqueda por campos (AND; parciales para texto y exactas para no texto).
 *              Si solo incluye { search: "valor" } realiza búsqueda general por nombre/apellidos.
 *              Si no incluye nada, actúa como paginación usando valores por defecto.
 * @access Public
 */
router.post('/search', authenticateToken, PropietarioController.getAllPropietarios);

/**
 * @route GET /propietarios/stats
 * @description Obtiene estadísticas de propietarios
 * @access Public
 */
router.get('/stats', authenticateToken, PropietarioController.getPropietarioStats);

/**
 * @route GET /propietarios/:id
 * @description Obtiene un propietario específico por ID
 * @access Public
 */
router.get('/:id', authenticateToken, validatePropietarioId, PropietarioController.getPropietarioById);

/**
 * @route POST /propietarios
 * @description Crea un nuevo propietario
 * @access Public
 */
router.post('/', authenticateToken, validatePropietario, PropietarioController.createPropietario);

/**
 * @route PUT /propietarios/:id
 * @description Actualiza un propietario existente
 * @access Public
 */
router.put('/:id', authenticateToken, validatePropietarioId, validatePropietario, PropietarioController.updatePropietario);

/**
 * @route DELETE /propietarios/:id
 * @description Elimina un propietario
 * @access Public
 */
router.delete('/:id', authenticateToken, validatePropietarioId, PropietarioController.deletePropietario);

module.exports = router;
