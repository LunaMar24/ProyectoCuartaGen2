/**
 * Controlador de Propietarios
 * @description Maneja todas las operaciones HTTP para la entidad Propietario
 */

const Propietario = require('../models/Propietario');
const User = require('../models/User');
const { validationResult } = require('express-validator');

class PropietarioController {
    static async getAllPropietarios(req, res) {
        try {
            // Corregir bugs de parsing
            const rawPage = req.query?.page ?? req.body?.page;
            const rawLimit = req.query?.limit ?? req.body?.limit;

            let page = parseInt(rawPage) || 1;
            let limit = parseInt(rawLimit) || 10;
            
            // Validaciones corregidas
            if (page < 1) page = 1;
            if (limit < 1) limit = 10;
            if (limit > 100) limit = 100;

            const search = req.query?.search ?? req.body?.search;
            
            // Extraer campos específicos de búsqueda del body (solo para POST)
            const searchFields = {};
            const validFields = ['nombre', 'apellidos', 'cedula', 'telefono', 'correo', 'usuarioId'];
            
            // Solo revisar el body para campos específicos si es POST
            if (req.method === 'POST' && req.body) {
                validFields.forEach(field => {
                    if (req.body[field] && req.body[field].toString().trim()) {
                        searchFields[field] = req.body[field].toString().trim();
                    }
                });
            }

            let result;

            // Lógica de decisión
            const hasSpecificFields = Object.keys(searchFields).length > 0;
            const hasGeneralSearch = search && search.toString().trim();

            if (hasSpecificFields) {
                // Búsqueda por campos específicos (solo POST con JSON)
                const propietarios = await Propietario.searchByFields(searchFields);
                result = {
                    propietarios,
                    pagination: {
                        currentPage: 1,
                        totalPages: 1,
                        totalPropietarios: propietarios.length,
                        hasNextPage: false,
                        hasPrevPage: false,
                        searchType: 'fields'
                    }
                };
            } else if (hasGeneralSearch) {
                // Búsqueda general por nombre/apellidos
                const propietarios = await Propietario.searchByName(search);
                result = {
                    propietarios,
                    pagination: {
                        currentPage: 1,
                        totalPages: 1,
                        totalPropietarios: propietarios.length,
                        hasNextPage: false,
                        hasPrevPage: false,
                        searchType: 'general'
                    }
                };
            } else {
                // Paginación normal
                result = await Propietario.paginate(page, limit);
            }

            res.status(200).json({
                success: true,
                message: 'Propietarios obtenidos correctamente',
                data: result.propietarios,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Error en getAllPropietarios:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    static async getPropietarioById(req, res) {
        try {
            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID debe ser un número válido'
                });
            }

            const prop = await Propietario.findById(id);

            if (!prop) {
                return res.status(404).json({
                    success: false,
                    message: 'Propietario no encontrado'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Propietario obtenido correctamente',
                data: prop
            });
        } catch (error) {
            console.error('Error en getPropietarioById:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    static async createPropietario(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const { nombre, apellidos, cedula, telefono, correo, usuarioId } = req.body;

            const usuario = await User.findById(usuarioId);
            if (!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            const existingProp = await Propietario.findByUsuarioId(usuarioId);
            if (existingProp) {
                return res.status(409).json({
                    success: false,
                    message: 'El usuario ya tiene un propietario asignado'
                });
            }

            const newProp = await Propietario.create({ nombre, apellidos, cedula, telefono, correo, usuarioId });

            res.status(201).json({
                success: true,
                message: 'Propietario creado correctamente',
                data: newProp
            });
        } catch (error) {
            console.error('Error en createPropietario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    static async updatePropietario(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const { id } = req.params;
            const { nombre, apellidos, cedula, telefono, correo, usuarioId } = req.body;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID debe ser un número válido'
                });
            }

            const existing = await Propietario.findById(id);
            if (!existing) {
                return res.status(404).json({
                    success: false,
                    message: 'Propietario no encontrado'
                });
            }

            let nextUsuarioId = usuarioId ?? existing.usuarioId;
            let nextCorreo = correo;

            const usuarioIdChanged = usuarioId !== undefined && usuarioId !== null && parseInt(usuarioId) !== existing.usuarioId;

            if (usuarioIdChanged) {
                const usuario = await User.findById(nextUsuarioId);
                if (!usuario) {
                    return res.status(404).json({
                        success: false,
                        message: 'Usuario no encontrado'
                    });
                }

                const propByUser = await Propietario.findByUsuarioId(nextUsuarioId);
                if (propByUser && propByUser.id !== parseInt(id)) {
                    return res.status(409).json({
                        success: false,
                        message: 'El usuario ya tiene un propietario asignado'
                    });
                }

                nextCorreo = usuario.email;
            }

            const updated = await Propietario.update(id, { nombre, apellidos, cedula, telefono, correo: nextCorreo, usuarioId: nextUsuarioId });

            const correoChanged = nextCorreo !== existing.correo;
            if (usuarioIdChanged || correoChanged) {
                await User.syncCorreo(nextUsuarioId, nextCorreo);
            }

            res.status(200).json({
                success: true,
                message: 'Propietario actualizado correctamente',
                data: updated
            });
        } catch (error) {
            console.error('Error en updatePropietario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    static async deletePropietario(req, res) {
        try {
            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'El ID debe ser un número válido'
                });
            }

            const existing = await Propietario.findById(id);
            if (!existing) {
                return res.status(404).json({
                    success: false,
                    message: 'Propietario no encontrado'
                });
            }

            await Propietario.delete(id);

            res.status(200).json({
                success: true,
                message: 'Propietario eliminado correctamente'
            });
        } catch (error) {
            console.error('Error en deletePropietario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    static async searchPropietarios(req, res) {
        try {
            const { q } = req.query;

            if (!q || q.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El parámetro de búsqueda es requerido'
                });
            }

            const propietarios = await Propietario.searchByName(q.trim());

            res.status(200).json({
                success: true,
                message: 'Búsqueda completada',
                data: propietarios,
                count: propietarios.length
            });
        } catch (error) {
            console.error('Error en searchPropietarios:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    static async getPropietarioStats(req, res) {
        try {
            const total = await Propietario.count();

            res.status(200).json({
                success: true,
                message: 'Estadísticas obtenidas correctamente',
                data: {
                    totalPropietarios: total,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Error en getPropietarioStats:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
}

module.exports = PropietarioController;
