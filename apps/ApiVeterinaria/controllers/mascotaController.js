/**
 * Controlador de Mascotas
 * @description Maneja todas las operaciones HTTP para la entidad Mascota
 */

const Mascota = require('../models/Mascota');
const { validationResult } = require('express-validator');

class MascotaController {
    static async getAllMascotas(req, res) {
        try {
            // Parsing de paginación consistente
            const rawPage = req.query?.page ?? req.body?.page;
            const rawLimit = req.query?.limit ?? req.body?.limit;

            let page = parseInt(rawPage) || 1;
            let limit = parseInt(rawLimit) || 10;
            if (page < 1) page = 1;
            if (limit < 1) limit = 10;
            if (limit > 100) limit = 100;

            const search = req.query?.search ?? req.body?.search;

            // Búsqueda avanzada por campos (solo para POST con JSON)
            const validFields = ['propietario', 'nombre', 'especie', 'raza', 'edad'];
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
                const mascotas = await Mascota.searchByFields(searchFields);
                result = {
                    mascotas,
                    pagination: {
                        currentPage: 1,
                        totalPages: 1,
                        totalMascotas: mascotas.length,
                        hasNextPage: false,
                        hasPrevPage: false,
                        searchType: 'fields'
                    }
                };
            } else if (hasGeneralSearch) {
                const mascotas = await Mascota.searchByName(search.toString().trim());
                result = {
                    mascotas,
                    pagination: {
                        currentPage: 1,
                        totalPages: 1,
                        totalMascotas: mascotas.length,
                        hasNextPage: false,
                        hasPrevPage: false,
                        searchType: 'general'
                    }
                };
            } else {
                result = await Mascota.paginate(page, limit);
            }

            res.status(200).json({
                success: true,
                message: 'Mascotas obtenidas correctamente',
                data: result.mascotas,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Error en getAllMascotas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    /**
     * Lista propietarios de mascotas desde la vista vproietariosmascota
     * Soporta:
     * - GET sin filtros: paginación
     * - GET ?search= o ?q=: búsqueda general
     * - POST con { id, propietario }: búsqueda por campos (AND)
     */
    static async getPropietariosMascota(req, res) {
        try {
            const rawPage = req.query?.page ?? req.body?.page;
            const rawLimit = req.query?.limit ?? req.body?.limit;
            let page = parseInt(rawPage) || 1;
            let limit = parseInt(rawLimit) || 10;
            if (page < 1) page = 1;
            if (limit < 1) limit = 10;
            if (limit > 100) limit = 100;

            const search = req.query?.search ?? req.query?.q ?? req.body?.search ?? req.body?.q;

            const validFields = ['id', 'propietario'];
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
            const hasSpecific = Object.keys(searchFields).length > 0;
            const hasGeneral = !!(search && search.toString().trim());

            if (hasSpecific) {
                const items = await Mascota.propietariosViewSearchByFields(searchFields);
                result = {
                    items,
                    pagination: {
                        currentPage: 1,
                        totalPages: 1,
                        totalItems: items.length,
                        hasNextPage: false,
                        hasPrevPage: false,
                        searchType: 'fields'
                    }
                };
            } else if (hasGeneral) {
                const items = await Mascota.propietariosViewSearchTerm(search.toString().trim());
                result = {
                    items,
                    pagination: {
                        currentPage: 1,
                        totalPages: 1,
                        totalItems: items.length,
                        hasNextPage: false,
                        hasPrevPage: false,
                        searchType: 'general'
                    }
                };
            } else {
                result = await Mascota.propietariosViewPaginate(page, limit);
            }

            res.status(200).json({ success: true, message: 'Propietarios de mascotas obtenidos correctamente', data: result.items, pagination: result.pagination });
        } catch (error) {
            console.error('Error en getPropietariosMascota:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
        }
    }

    static async searchPropietariosMascota(req, res) {
        try {
            const { q } = req.query;
            if (!q || q.toString().trim().length === 0) {
                return res.status(400).json({ success: false, message: 'El parámetro de búsqueda es requerido' });
            }
            const items = await Mascota.propietariosViewSearchTerm(q.toString().trim());
            res.status(200).json({ success: true, message: 'Búsqueda completada', data: items, count: items.length });
        } catch (error) {
            console.error('Error en searchPropietariosMascota:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
        }
    }

    static async getMascotaById(req, res) {
        try {
            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({ success: false, message: 'El ID debe ser un número válido' });
            }

            const mascota = await Mascota.findById(id);

            if (!mascota) {
                return res.status(404).json({ success: false, message: 'Mascota no encontrada' });
            }

            res.status(200).json({ success: true, message: 'Mascota obtenida correctamente', data: mascota });
        } catch (error) {
            console.error('Error en getMascotaById:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
        }
    }

    static async createMascota(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, message: 'Errores de validación', errors: errors.array() });
            }

            const { propietario, nombre, especie, raza, edad } = req.body;

            const newMascota = await Mascota.create({ propietario, nombre, especie, raza, edad });

            res.status(201).json({ success: true, message: 'Mascota creada correctamente', data: newMascota });
        } catch (error) {
            console.error('Error en createMascota:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
        }
    }

    static async updateMascota(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, message: 'Errores de validación', errors: errors.array() });
            }

            const { id } = req.params;
            const { propietario, nombre, especie, raza, edad } = req.body;

            if (isNaN(id)) {
                return res.status(400).json({ success: false, message: 'El ID debe ser un número válido' });
            }

            const existing = await Mascota.findById(id);
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Mascota no encontrada' });
            }

            const updated = await Mascota.update(id, { propietario, nombre, especie, raza, edad });

            res.status(200).json({ success: true, message: 'Mascota actualizada correctamente', data: updated });
        } catch (error) {
            console.error('Error en updateMascota:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
        }
    }

    static async deleteMascota(req, res) {
        try {
            const { id } = req.params;

            if (isNaN(id)) {
                return res.status(400).json({ success: false, message: 'El ID debe ser un número válido' });
            }

            const existing = await Mascota.findById(id);
            if (!existing) {
                return res.status(404).json({ success: false, message: 'Mascota no encontrada' });
            }

            await Mascota.delete(id);

            res.status(200).json({ success: true, message: 'Mascota eliminada correctamente' });
        } catch (error) {
            console.error('Error en deleteMascota:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
        }
    }

    static async searchMascotas(req, res) {
        try {
            const { q } = req.query;
            if (!q || q.trim().length === 0) {
                return res.status(400).json({ success: false, message: 'El parámetro de búsqueda es requerido' });
            }

            const mascotas = await Mascota.searchByName(q.trim());

            res.status(200).json({ success: true, message: 'Búsqueda completada', data: mascotas, count: mascotas.length });
        } catch (error) {
            console.error('Error en searchMascotas:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
        }
    }

    static async getMascotaStats(req, res) {
        try {
            const total = await Mascota.count();
            res.status(200).json({ success: true, message: 'Estadísticas obtenidas correctamente', data: { totalMascotas: total, timestamp: new Date().toISOString() } });
        } catch (error) {
            console.error('Error en getMascotaStats:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
        }
    }
}

module.exports = MascotaController;
