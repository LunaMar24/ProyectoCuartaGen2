/**
 * Controlador de Usuarios
 * @description Maneja todas las operaciones HTTP para la entidad Usuario
 */

const User = require('../models/User');
const { validationResult } = require('express-validator');

/**
 * Clase que maneja las operaciones del controlador de usuarios
 */
class UserController {
    /**
     * Obtiene todos los usuarios con paginación opcional
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} res - Objeto de respuesta Express
     * @returns {Promise<void>}
     */
    static async getAllUsers(req, res) {
        try {
            // page/limit desde query o body con validación explícita y defaults
            const rawPage = req.query?.page ?? req.body?.page;
            const rawLimit = req.query?.limit ?? req.body?.limit;

            let page = 0;
            let limit = 0;

            // Si no es número o es < 1, asignar default
            if (isNaN(rawPage) || parseInt(rawPage) < 1) {
                page = 1;
            } else {
                page = parseInt(rawPage);
            }

            if (isNaN(rawLimit) || parseInt(rawLimit) < 1) {
                limit = 10;
            } else {
                limit = parseInt(rawLimit);
            }
            // Límite máximo
            if (limit > 100) limit = 100;

            const search = req.query?.search ?? req.body?.search;

            // Búsqueda avanzada por campos (solo para POST con JSON)
            const validFields = ['id', 'nombre', 'email', 'telefono', 'fecha_creacion', 'fechaDesde', 'fechaHasta'];
            const searchFields = {};
            if (req.method === 'POST' && req.body) {
                validFields.forEach(field => {
                    if (req.body[field] !== undefined && req.body[field] !== null) {
                        const v = req.body[field].toString().trim();
                        if (v) searchFields[field] = v;
                    }
                });
            }

            let result;

            const hasSpecificFields = Object.keys(searchFields).length > 0;
            const hasGeneralSearch = !!(search && search.toString().trim());

            if (hasSpecificFields) {
                const users = await User.searchByFields(searchFields);
                result = {
                    users,
                    pagination: {
                        currentPage: 1,
                        totalPages: 1,
                        totalUsers: users.length,
                        hasNextPage: false,
                        hasPrevPage: false,
                        searchType: 'fields'
                    }
                };
            } else if (hasGeneralSearch) {
                const users = await User.searchByName(search.toString().trim());
                result = {
                    users,
                    pagination: {
                        currentPage: 1,
                        totalPages: 1,
                        totalUsers: users.length,
                        hasNextPage: false,
                        hasPrevPage: false,
                        searchType: 'general'
                    }
                };
            } else {
                // Obtener usuarios con paginación
                result = await User.paginate(page, limit);
            }

            res.status(200).json({
                success: true,
                message: 'Usuarios obtenidos correctamente',
                data: result.users,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Error en getAllUsers:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtiene un usuario por su ID
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} res - Objeto de respuesta Express
     * @returns {Promise<void>}
     */
    static async getUserById(req, res) {
        try {
            const { id } = req.params;

            // Validar que el ID sea un número
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID debe ser un número válido'
                });
            }

            const user = await User.findById(id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Usuario obtenido correctamente',
                data: user
            });
        } catch (error) {
            console.error('Error en getUserById:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Crea un nuevo usuario
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} res - Objeto de respuesta Express
     * @returns {Promise<void>}
     */
    static async createUser(req, res) {
        try {
            // Verificar errores de validación
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const { nombre, email, telefono } = req.body;
            const normalizedTipo = 'A';

            // Verificar si el email ya existe
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'El email ya está registrado'
                });
            }

            // Crear el usuario
            const newUser = await User.create({ nombre, email, telefono, tipo_Usuario: normalizedTipo });

            res.status(201).json({
                success: true,
                message: 'Usuario creado correctamente',
                data: newUser
            });
        } catch (error) {
            console.error('Error en createUser:', error);
            const status = error.status || 500;
            res.status(status).json({
                success: false,
                message: error.message || 'Error interno del servidor',
                code: error.code
            });
        }
    }

    /**
     * Actualiza un usuario existente
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} res - Objeto de respuesta Express
     * @returns {Promise<void>}
     */
    static async updateUser(req, res) {
        try {
            // Verificar errores de validación
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const { id } = req.params;
            const { nombre, email, telefono, tipo_Usuario } = req.body;

            // Validar que el ID sea un número
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID debe ser un número válido'
                });
            }

            // Verificar si el usuario existe
            const existingUser = await User.findById(id);
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            if ((existingUser.tipo_Usuario || '').toString().trim().toUpperCase() === 'C') {
                return res.status(409).json({
                    success: false,
                    message: 'No se puede actualizar un usuario cliente desde mantenimiento de usuarios. Debe actualizarlo desde mantenimiento de propietarios.',
                    code: 'CLIENT_USER_UPDATE_BLOCKED'
                });
            }

            const currentUserId = req.user?.userId;
            if (!currentUserId) {
                return res.status(401).json({
                    success: false,
                    message: 'Autenticación requerida'
                });
            }

            const loggedUser = await User.findById(currentUserId);
            if (!loggedUser) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario autenticado no válido'
                });
            }

            if ((loggedUser.tipo_Usuario || '').toString().trim().toUpperCase() === 'C') {
                return res.status(403).json({
                    success: false,
                    message: 'No puedes actualizar usuarios desde Usuarios cuando tu tipo de usuario es cliente. Debes hacerlo desde propietarios.',
                    code: 'CLIENT_USER_UPDATE_BLOCKED'
                });
            }

            // Verificar si el email ya existe en otro usuario
            if (email !== existingUser.email) {
                const emailUser = await User.findByEmail(email);
                if (emailUser && emailUser.id !== parseInt(id)) {
                    return res.status(409).json({
                        success: false,
                        message: 'El email ya está registrado en otro usuario'
                    });
                }
            }

            const emailChanged = email && email !== existingUser.email;

            const normalizedTipo = tipo_Usuario
                ? tipo_Usuario.toString().trim().toUpperCase()
                : (existingUser.tipo_Usuario || '').toString().trim().toUpperCase();

            // Actualizar el usuario
            const updatedUser = await User.update(id, { nombre, email, telefono, tipo_Usuario: normalizedTipo });

            if (emailChanged) {
                await User.syncCorreo(id, email);
            }

            res.status(200).json({
                success: true,
                message: 'Usuario actualizado correctamente',
                data: updatedUser
            });
        } catch (error) {
            console.error('Error en updateUser:', error);
            const status = error.status || 500;
            res.status(status).json({
                success: false,
                message: error.message || 'Error interno del servidor',
                code: error.code
            });
        }
    }

    /**
     * Elimina un usuario
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} res - Objeto de respuesta Express
     * @returns {Promise<void>}
     */
    static async deleteUser(req, res) {
        try {
            const { id } = req.params;

            // Validar que el ID sea un número
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID debe ser un número válido'
                });
            }

            // Verificar si el usuario existe
            const existingUser = await User.findById(id);
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            if ((existingUser.tipo_Usuario || '').toString().trim().toUpperCase() === 'C') {
                return res.status(409).json({
                    success: false,
                    message: 'No se puede eliminar un usuario cliente desde mantenimiento de usuarios. Debe eliminarlo desde mantenimiento de propietarios.',
                    code: 'CLIENT_USER_DELETE_BLOCKED'
                });
            }

            // Eliminar el usuario
            await User.delete(id);

            res.status(200).json({
                success: true,
                message: 'Usuario eliminado correctamente'
            });
        } catch (error) {
            console.error('Error en deleteUser:', error);
            const status = error.status || 500;
            res.status(status).json({
                success: false,
                message: error.message || 'Error interno del servidor',
                code: error.code
            });
        }
    }

    /**
     * Resetea la contraseña de un usuario al valor por defecto del sistema
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} res - Objeto de respuesta Express
     * @returns {Promise<void>}
     */
    static async resetUserPassword(req, res) {
        try {
            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID debe ser un número válido'
                });
            }

            const currentUserId = req.user?.userId;
            if (!currentUserId) {
                return res.status(401).json({
                    success: false,
                    message: 'Autenticación requerida'
                });
            }

            const loggedUser = await User.findById(currentUserId);
            if (!loggedUser) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario autenticado no válido'
                });
            }

            if ((loggedUser.tipo_Usuario || '').toString().trim().toUpperCase() === 'C') {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para resetear contraseñas de usuarios.',
                    code: 'CLIENT_USER_PASSWORD_RESET_BLOCKED'
                });
            }

            const existingUser = await User.findById(id);
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            const updated = await User.resetPasswordToDefault(id);
            if (!updated) {
                return res.status(500).json({
                    success: false,
                    message: 'No se pudo resetear la contraseña del usuario'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Contraseña reseteada correctamente'
            });
        } catch (error) {
            console.error('Error en resetUserPassword:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Busca usuarios por nombre
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} res - Objeto de respuesta Express
     * @returns {Promise<void>}
     */
    static async searchUsers(req, res) {
        try {
            const { q } = req.query;

            if (!q || q.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El parámetro de búsqueda es requerido'
                });
            }

            const users = await User.searchByName(q.trim());

            res.status(200).json({
                success: true,
                message: 'Búsqueda completada',
                data: users,
                count: users.length
            });
        } catch (error) {
            console.error('Error en searchUsers:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Obtiene estadísticas de usuarios
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} res - Objeto de respuesta Express
     * @returns {Promise<void>}
     */
    static async getUserStats(req, res) {
        try {
            const total = await User.count();

            res.status(200).json({
                success: true,
                message: 'Estadísticas obtenidas correctamente',
                data: {
                    totalUsers: total,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Error en getUserStats:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
}

module.exports = UserController;