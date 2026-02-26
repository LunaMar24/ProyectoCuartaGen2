/**
 * Middleware de Validación
 * @description Contiene todas las validaciones para las rutas de usuarios
 */

const { body, param, query } = require('express-validator');

/**
 * Validaciones para los datos de usuario
 * Incluye validaciones para nombre, email y teléfono
 */
const validateUser = [
    body('nombre')
        .trim()
        .notEmpty()
        .withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios'),

    body('email')
        .trim()
        .notEmpty()
        .withMessage('El email es requerido')
            .isEmail()
            .withMessage('Debe ser un email válido')
        .normalizeEmail()
            .matches(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)
            .withMessage('Formato de correo inválido')
        .isLength({ max: 255 })
        .withMessage('El email no puede exceder 255 caracteres'),

    body('telefono')
        .trim()
        .notEmpty()
        .withMessage('El teléfono es requerido')
        .matches(/^[\+]?[0-9\-\(\)\s]{7,20}$/)
        .withMessage('Formato de teléfono inválido')
        .isLength({ min: 7, max: 20 })
        .withMessage('El teléfono debe tener entre 7 y 20 caracteres'),

    body('tipo_Usuario')
        .trim()
        .notEmpty()
        .withMessage('El tipo de usuario es requerido')
        .isIn(['A', 'C'])
        .withMessage('El tipo de usuario debe ser A o C')
];

/**
 * Validaciones para registro de usuario
 * Incluye validación de contraseña
 */
const validateRegister = [
    body('nombre')
        .trim()
        .notEmpty()
        .withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios'),

    body('email')
        .trim()
        .notEmpty()
        .withMessage('El email es requerido')
            .isEmail()
            .withMessage('Debe ser un email válido')
        .normalizeEmail()
            .matches(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)
            .withMessage('Formato de correo inválido')
        .isLength({ max: 255 })
        .withMessage('El email no puede exceder 255 caracteres'),

    body('telefono')
        .trim()
        .notEmpty()
        .withMessage('El teléfono es requerido')
        .matches(/^[\+]?[0-9\-\(\)\s]{7,20}$/)
        .withMessage('Formato de teléfono inválido')
        .isLength({ min: 7, max: 20 })
        .withMessage('El teléfono debe tener entre 7 y 20 caracteres'),

    body('password')
        .isLength({ min: 8, max: 128 })
        .withMessage('La contraseña debe tener entre 8 y 128 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial'),

    body('tipo_Usuario')
        .trim()
        .notEmpty()
        .withMessage('El tipo de usuario es requerido')
        .isIn(['A', 'C'])
        .withMessage('El tipo de usuario debe ser A o C')
];

/**
 * Validaciones para login
 */
const validateLogin = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('El email es requerido')
        .isEmail()
        .withMessage('Debe ser un email válido')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('La contraseña es requerida')
];

/**
 * Validaciones para actualización de perfil
 */
const validateProfileUpdate = [
    body('nombre')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios'),

    body('email')
        .optional()
        .trim()
            .isEmail()
            .withMessage('Debe ser un email válido')
        .normalizeEmail()
            .matches(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)
            .withMessage('Formato de correo inválido')
        .isLength({ max: 255 })
        .withMessage('El email no puede exceder 255 caracteres'),

    body('telefono')
        .optional()
        .trim()
        .matches(/^[\+]?[0-9\-\(\)\s]{7,20}$/)
        .withMessage('Formato de teléfono inválido')
        .isLength({ min: 7, max: 20 })
        .withMessage('El teléfono debe tener entre 7 y 20 caracteres'),

    body('tipo_Usuario')
        .optional()
        .trim()
        .isIn(['A', 'C'])
        .withMessage('El tipo de usuario debe ser A o C'),

    body('currentPassword')
        .optional()
        .notEmpty()
        .withMessage('La contraseña actual no puede estar vacía'),

    body('newPassword')
        .optional()
        .isLength({ min: 8, max: 128 })
        .withMessage('La nueva contraseña debe tener entre 8 y 128 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('La nueva contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial')
];

/**
 * Validación para el parámetro ID de usuario
 * Verifica que sea un número entero positivo
 */
const validateUserId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número entero positivo')
];

/**
 * Validación para parámetros de paginación
 * Verifica que page y limit sean números válidos
 */
const validatePagination = [
    body('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('La página debe ser un número entero positivo'),
    
    body('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('El límite debe ser un número entre 1 y 100')
];

/**
 * Validación para búsquedas
 * Verifica que el término de búsqueda tenga una longitud mínima
 */
const validateSearch = [
    body('q')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('El término de búsqueda debe tener entre 1 y 100 caracteres')
];

/**
 * Middleware para sanitizar y limpiar datos de entrada
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const sanitizeInput = (req, res, next) => {
    if (req.body) {
        // Eliminar espacios en blanco al inicio y final de strings
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].trim();
            }
        });

        // Eliminar campos vacíos
        Object.keys(req.body).forEach(key => {
            if (req.body[key] === '' || req.body[key] === null || req.body[key] === undefined) {
                delete req.body[key];
            }
        });
    }
    next();
};

/**
 * Middleware para validar JSON malformado
 * @param {Error} err - Error object
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const validateJSON = (err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            message: 'JSON malformado',
            error: 'La estructura del JSON enviado no es válida'
        });
    }
    next(err);
};

/**
 * Middleware para manejar errores de validación
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const handleValidationErrors = (req, res, next) => {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Errores de validación',
            errors: errors.array().map(error => ({
                field: error.path || error.param,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
};

/**
 * Middleware para validar Content-Type en POST y PUT
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const validateContentType = (req, res, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        if (!req.is('application/json')) {
            return res.status(400).json({
                success: false,
                message: 'Content-Type debe ser application/json'
            });
        }
    }
    next();
};

/**
 * Validaciones específicas para actualización parcial (PATCH)
 * Permite campos opcionales para actualizaciones parciales
 */
const validateUserPartial = [
    body('nombre')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios'),

    body('email')
        .optional()
        .trim()
            .isEmail()
            .withMessage('Debe ser un email válido')
        .normalizeEmail()
            .matches(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)
            .withMessage('Formato de correo inválido')
        .isLength({ max: 255 })
        .withMessage('El email no puede exceder 255 caracteres'),

    body('telefono')
        .optional()
        .trim()
        .matches(/^[\+]?[0-9\-\(\)\s]{7,20}$/)
        .withMessage('Formato de teléfono inválido')
        .isLength({ min: 7, max: 20 })
        .withMessage('El teléfono debe tener entre 7 y 20 caracteres')
];

/**
 * Validaciones para datos de propietario
 * Campos: Nombre, Apellidos, Cedula, Telefono, Correo
 */
const validatePropietario = [
    body('nombre')
        .trim()
        .notEmpty()
        .withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 100 })
        .withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)
        .withMessage('El nombre solo puede contener letras y espacios'),

    body('apellidos')
        .trim()
        .notEmpty()
        .withMessage('Los apellidos son requeridos')
        .isLength({ min: 2, max: 100 })
        .withMessage('Los apellidos deben tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)
        .withMessage('Los apellidos solo pueden contener letras y espacios'),

    body('cedula')
        .trim()
        .notEmpty()
        .withMessage('La cédula es requerida')
        .isLength({ min: 5, max: 20 })
        .withMessage('La cédula debe tener entre 5 y 20 caracteres'),

    body('telefono')
        .trim()
        .notEmpty()
        .withMessage('El teléfono es requerido')
        .matches(/^[\+]?[0-9\-\(\)\s]{7,20}$/)
        .withMessage('Formato de teléfono inválido')
        .isLength({ min: 7, max: 20 })
        .withMessage('El teléfono debe tener entre 7 y 20 caracteres'),

    body('correo')
        .trim()
        .notEmpty()
        .withMessage('El correo es requerido')
            .isEmail()
            .withMessage('Debe ser un correo válido')
            .normalizeEmail()
            .matches(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)
            .withMessage('Formato de correo inválido')
            .isLength({ max: 255 })
            .withMessage('El correo no puede exceder 255 caracteres')
];

/**
 * Validación para el parámetro ID de propietario
 */
const validatePropietarioId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número entero positivo')
];

/**
 * Validaciones para datos de mascota
 * Campos: Propietario, Nombre, Especie, Raza, Edad
 */
const validateMascota = [
    body('propietario')
        .notEmpty()
        .withMessage('El propietario es requerido')
        .isInt({ min: 1 })
        .withMessage('El propietario debe ser un ID numérico válido'),

    body('nombre')
        .trim()
        .notEmpty()
        .withMessage('El nombre de la mascota es requerido')
        .isLength({ min: 1, max: 100 })
        .withMessage('El nombre debe tener entre 1 y 100 caracteres'),

    body('especie')
        .trim()
        .optional()
        .isLength({ max: 50 })
        .withMessage('La especie no puede exceder 50 caracteres'),

    body('raza')
        .trim()
        .optional()
        .isLength({ max: 50 })
        .withMessage('La raza no puede exceder 50 caracteres'),

    body('edad')
        .trim()
        .optional()
        .isLength({ max: 20 })
        .withMessage('La edad no puede exceder 20 caracteres')
];

/**
 * Validación para el parámetro ID de mascota
 */
const validateMascotaId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número entero positivo')
];

/**
 * Validaciones para datos de historial médico
 * Campos: Mascota, FechaAtencion, Motivo, Diagnostico
 */
const validateHistorial = [
    body('mascota')
        .notEmpty()
        .withMessage('La mascota es requerida')
        .isInt({ min: 1 })
        .withMessage('La mascota debe ser un ID numérico válido'),

    body('fechaAtencion')
        .optional()
        .isISO8601()
        .withMessage('La fecha debe ser un datetime ISO 8601'),

    body('motivo')
        .trim()
        .notEmpty()
        .withMessage('El motivo es requerido')
        .isLength({ min: 1, max: 500 })
        .withMessage('El motivo debe tener entre 1 y 500 caracteres'),

    body('diagnostico')
        .trim()
        .optional()
        .isLength({ max: 2000 })
        .withMessage('El diagnóstico no puede exceder 2000 caracteres'),

    body('idCita')
        .optional({ nullable: true })
        .isInt({ min: 1 })
        .withMessage('El idCita debe ser un ID numérico válido')
];

const validateHistorialId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('El ID debe ser un número entero positivo')
];

/**
 * Validaciones para reservar cita temporal
 * Campos: mascotaId, fechaInicio, fechaFin, timeoutMinutos
 */
const validateCitaReserva = [
    body('mascotaId')
        .notEmpty()
        .withMessage('La mascota es requerida')
        .isInt({ min: 1 })
        .withMessage('La mascota debe ser un ID numérico válido'),

    body('fechaInicio')
        .notEmpty()
        .withMessage('La fecha de inicio es requerida')
        .isISO8601()
        .withMessage('La fecha de inicio debe ser un datetime ISO 8601'),

    body('fechaFin')
        .notEmpty()
        .withMessage('La fecha de fin es requerida')
        .isISO8601()
        .withMessage('La fecha de fin debe ser un datetime ISO 8601'),

    body('timeoutMinutos')
        .notEmpty()
        .withMessage('El timeout en minutos es requerido')
        .isInt({ min: 1, max: 120 })
        .withMessage('El timeout debe ser un número entre 1 y 120 minutos')
];

/**
 * Validaciones para confirmar una reserva y crear cita
 * Campos: idReserva, motivo, notas
 */
const validateCitaConfirmacion = [
    body('idReserva')
        .notEmpty()
        .withMessage('El id de reserva es requerido')
        .isInt({ min: 1 })
        .withMessage('El id de reserva debe ser un número entero positivo'),

    body('motivo')
        .trim()
        .notEmpty()
        .withMessage('El motivo es requerido')
        .isLength({ min: 1, max: 255 })
        .withMessage('El motivo debe tener entre 1 y 255 caracteres'),

    body('notas')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Las notas no pueden exceder 2000 caracteres')
];

    const validateCitaId = [
        param('id')
        .isInt({ min: 1 })
        .withMessage('El ID de cita debe ser un número entero positivo')
    ];

    const validateReservaId = [
        param('idReserva')
            .isInt({ min: 1 })
            .withMessage('El ID de reserva debe ser un número entero positivo')
    ];

    const validateCitaListQuery = [
        query('fechaDesde')
            .optional()
            .isISO8601()
            .withMessage('fechaDesde debe ser un datetime ISO 8601'),

        query('fechaHasta')
            .optional()
            .isISO8601()
            .withMessage('fechaHasta debe ser un datetime ISO 8601'),

        query('estado')
            .optional()
            .matches(/^[A-Za-z](,[A-Za-z])*$/)
            .withMessage('estado debe contener uno o más códigos de estado separados por coma (ej: P,F,C)'),

        query('mascotaId')
            .optional()
            .isInt({ min: 1 })
            .withMessage('mascotaId debe ser un número entero positivo'),

        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('page debe ser un número entero positivo'),

        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('limit debe ser un número entre 1 y 100')
    ];

module.exports = {
    validateUser,
    validateRegister,
    validateLogin,
    validateProfileUpdate,
    validateUserId,
    validatePagination,
    validateSearch,
    validateUserPartial,
    sanitizeInput,
    validateJSON,
    handleValidationErrors,
    validateContentType,
    validatePropietario,
    validatePropietarioId,
    validateMascota,
    validateMascotaId,
    validateHistorial,
    validateHistorialId,
    validateCitaReserva,
    validateCitaConfirmacion,
    validateCitaId,
    validateCitaListQuery,
    validateReservaId
};