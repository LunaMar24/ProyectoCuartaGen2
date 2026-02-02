/**
 * Controlador de Historial Médico
 * @description Maneja las operaciones HTTP para historiales médicos
 */

const Historial = require('../models/HistorialMedico');
const { validationResult } = require('express-validator');

class HistorialController {
    static async getAllHistoriales(req, res) {
        try {
            // Paginación unificada
            const rawPage = req.query?.page ?? req.body?.page;
            const rawLimit = req.query?.limit ?? req.body?.limit;

            let page = parseInt(rawPage) || 1;
            let limit = parseInt(rawLimit) || 10;
            if (page < 1) page = 1;
            if (limit < 1) limit = 10;
            if (limit > 100) limit = 100;

            // Aceptar 'search' o 'q' tanto en query como en body
            const search = req.query?.search ?? req.body?.search ?? req.query?.q ?? req.body?.q;

            // Búsqueda avanzada por campos (solo POST con JSON)
            const validFields = ['mascota', 'fechaAtencion', 'motivo', 'diagnostico', 'fechaDesde', 'fechaHasta'];
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
                const historiales = await Historial.searchByFields(searchFields);
                result = {
                    historiales,
                    pagination: {
                        currentPage: 1,
                        totalPages: 1,
                        totalHistoriales: historiales.length,
                        hasNextPage: false,
                        hasPrevPage: false,
                        searchType: 'fields'
                    }
                };
            } else if (hasGeneralSearch) {
                const historiales = await Historial.searchByTerm(search.toString().trim());
                result = {
                    historiales,
                    pagination: {
                        currentPage: 1,
                        totalPages: 1,
                        totalHistoriales: historiales.length,
                        hasNextPage: false,
                        hasPrevPage: false,
                        searchType: 'general'
                    }
                };
            } else {
                result = await Historial.paginate(page, limit);
            }

            res.status(200).json({ success: true, message: 'Historiales obtenidos correctamente', data: result.historiales, pagination: result.pagination });
        } catch (error) {
            console.error('Error en getAllHistoriales:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
        }
    }

    static async getHistorialById(req, res) {
        try {
            const { id } = req.params;
            if (isNaN(id)) return res.status(400).json({ success: false, message: 'El ID debe ser un número válido' });

            const rec = await Historial.findById(id);
            if (!rec) return res.status(404).json({ success: false, message: 'Historial no encontrado' });

            res.status(200).json({ success: true, message: 'Historial obtenido correctamente', data: rec });
        } catch (error) {
            console.error('Error en getHistorialById:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
        }
    }

    static async createHistorial(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Errores de validación', errors: errors.array() });

            const { mascota, fechaAtencion, motivo, diagnostico } = req.body;
            const newRec = await Historial.create({ mascota, fechaAtencion, motivo, diagnostico });

            res.status(201).json({ success: true, message: 'Historial creado correctamente', data: newRec });
        } catch (error) {
            console.error('Error en createHistorial:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
        }
    }

    static async updateHistorial(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Errores de validación', errors: errors.array() });

            const { id } = req.params;
            const { mascota, fechaAtencion, motivo, diagnostico } = req.body;
            if (isNaN(id)) return res.status(400).json({ success: false, message: 'El ID debe ser un número válido' });

            const existing = await Historial.findById(id);
            if (!existing) return res.status(404).json({ success: false, message: 'Historial no encontrado' });

            // Si no se envía fechaAtencion, conservar la existente
            const fechaToUse = fechaAtencion !== undefined && fechaAtencion !== null ? fechaAtencion : existing.fechaAtencion;
            const updated = await Historial.update(id, { mascota, fechaAtencion: fechaToUse, motivo, diagnostico });
            res.status(200).json({ success: true, message: 'Historial actualizado correctamente', data: updated });
        } catch (error) {
            console.error('Error en updateHistorial:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
        }
    }

    static async deleteHistorial(req, res) {
        try {
            const { id } = req.params;
            if (isNaN(id)) return res.status(400).json({ success: false, message: 'El ID debe ser un número válido' });

            const existing = await Historial.findById(id);
            if (!existing) return res.status(404).json({ success: false, message: 'Historial no encontrado' });

            await Historial.delete(id);
            res.status(200).json({ success: true, message: 'Historial eliminado correctamente' });
        } catch (error) {
            console.error('Error en deleteHistorial:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
        }
    }

    static async searchHistoriales(req, res) {
        try {
            const { q } = req.query;
            if (!q || q.trim().length === 0) return res.status(400).json({ success: false, message: 'El parámetro de búsqueda es requerido' });

            const historiales = await Historial.searchByTerm(q.trim());
            res.status(200).json({ success: true, message: 'Búsqueda completada', data: historiales, count: historiales.length });
        } catch (error) {
            console.error('Error en searchHistoriales:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
        }
    }

    static async getHistorialStats(req, res) {
        try {
            const total = await Historial.count();
            res.status(200).json({ success: true, message: 'Estadísticas obtenidas correctamente', data: { totalHistoriales: total, timestamp: new Date().toISOString() } });
        } catch (error) {
            console.error('Error en getHistorialStats:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
        }
    }
}

module.exports = HistorialController;
