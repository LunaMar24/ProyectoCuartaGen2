/**
 * Modelo de Mascota
 * @description Maneja todas las operaciones CRUD para la entidad Mascota
 *
 * Nota: Este archivo asume que existe la tabla `mascota` con las columnas:
 * - idMascota (INT, PK, autonumerico)
 * - Propietario (INT) -- FK hacia propietarios.idPropietario
 * - Nombre (VARCHAR)
 * - Especie (VARCHAR)
 * - Raza (VARCHAR)
 * - Edad (VARCHAR)
 */

const { pool } = require('../config/database');

class Mascota {
    /**
     * Constructor para crear una instancia de Mascota
     * @param {Object} data
     * @param {number} data.id - ID de la mascota
     * @param {number} data.propietario - ID del propietario
     * @param {string} data.nombre - Nombre
    * @param {string} data.especie - Especie
    * @param {string} data.raza - Raza
     * @param {string} data.edad - Edad
     */
    constructor(data) {
        this.id = data.id;
        this.propietario = data.propietario;
        this.nombre = data.nombre;
    this.especie = data.especie;
    this.raza = data.raza;
        this.edad = data.edad;
    }

    static async findAll() {
        try {
            const [rows] = await pool.execute(
                'SELECT idMascota as id, Propietario as propietario, Nombre as nombre, Especie as especie, Raza as raza, Edad as edad FROM vmascota ORDER BY Nombre'
            );
            return rows;
        } catch (error) {
            console.error('Error en Mascota.findAll:', error);
            throw new Error('Error al obtener mascotas');
        }
    }

    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT idMascota as id, Propietario as propietario, Nombre as nombre, Especie as especie, Raza as raza, Edad as edad FROM vmascota WHERE idMascota = ?',
                [id]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en Mascota.findById:', error);
            throw new Error('Error al buscar mascota por ID');
        }
    }

    static async create(data) {
        try {
            const { propietario, nombre, especie, raza, edad } = data;
            const [result] = await pool.execute(
                'INSERT INTO mascota (Propietario, Nombre, Especie, Raza, Edad) VALUES (?, ?, ?, ?, ?)',
                [propietario, nombre, especie, raza, edad]
            );

            const newMascota = await this.findById(result.insertId);
            return newMascota;
        } catch (error) {
            console.error('Error en Mascota.create:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Entrada duplicada');
            }
            throw new Error('Error al crear mascota');
        }
    }

    static async update(id, data) {
        try {
            const { propietario, nombre, especie, raza, edad } = data;
            const query = 'UPDATE mascota SET Propietario = ?, Nombre = ?, Especie = ?, Raza = ?, Edad = ? WHERE idMascota = ?';
            const params = [propietario, nombre, especie, raza, edad, id];

            const [result] = await pool.execute(query, params);
            if (result.affectedRows === 0) return null;

            const updated = await this.findById(id);
            return updated;
        } catch (error) {
            console.error('Error en Mascota.update:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Entrada duplicada');
            }
            throw new Error('Error al actualizar mascota');
        }
    }

    static async delete(id) {
        try {
            const [result] = await pool.execute('DELETE FROM mascota WHERE idMascota = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en Mascota.delete:', error);
            throw new Error('Error al eliminar mascota');
        }
    }

    static async searchByName(term) {
        try {
            const [rows] = await pool.execute(
                'SELECT idMascota as id, Propietario as propietario, Nombre as nombre, Especie as especie, Raza as raza, Edad as edad FROM vmascota WHERE Nombre LIKE ? OR Especie LIKE ? OR Raza LIKE ? ORDER BY Nombre',
                [`%${term}%`, `%${term}%`, `%${term}%`]
            );
            return rows;
        } catch (error) {
            console.error('Error en Mascota.searchByName:', error);
            throw new Error('Error al buscar mascotas por nombre');
        }
    }

    /**
     * Busca mascotas por múltiples campos dinámicamente
    * - Campos texto (LIKE): nombre, especie, raza, edad
     * - Campo exacto (=): propietario
     * Operador: AND entre condiciones
     * @param {Object} searchFields
     * @param {number} [searchFields.propietario]
     * @param {string} [searchFields.nombre]
    * @param {string} [searchFields.especie]
    * @param {string} [searchFields.raza]
     * @param {string} [searchFields.edad]
     * @returns {Promise<Array>}
     */
    static async searchByFields(searchFields) {
        try {
            const validFields = ['propietario', 'nombre', 'especie', 'raza', 'edad'];
            const fieldMappings = {
                propietario: 'Propietario',
                nombre: 'Nombre',
                especie: 'Especie',
                raza: 'Raza',
                edad: 'Edad'
            };

            const textFields = ['nombre', 'especie', 'raza', 'edad', 'propietario'];
            const exactFields = [];

            const conditions = [];
            const params = [];

            for (const [field, value] of Object.entries(searchFields || {})) {
                if (!validFields.includes(field)) continue;
                if (value === undefined || value === null) continue;
                const str = value.toString().trim();
                if (!str) continue;

                if (field === 'propietario' && /^\d+$/.test(str)) {
                    conditions.push('idMascota IN (SELECT idMascota FROM mascota WHERE Propietario = ?)');
                    params.push(Number(str));
                    continue;
                }

                const dbField = fieldMappings[field];
                if (textFields.includes(field)) {
                    conditions.push(`${dbField} LIKE ?`);
                    params.push(`%${str}%`);
                } else if (exactFields.includes(field)) {
                    conditions.push(`${dbField} = ?`);
                    params.push(str);
                }
            }

            if (conditions.length === 0) return [];

            const whereClause = conditions.join(' AND ');
            const query = `
                SELECT idMascota as id, Propietario as propietario, Nombre as nombre, Especie as especie, Raza as raza, Edad as edad
                FROM vmascota
                WHERE ${whereClause}
                ORDER BY Nombre
            `;
            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Error en Mascota.searchByFields:', error);
            throw new Error('Error al buscar mascotas por campos');
        }
    }

    static async count() {
        try {
            const [rows] = await pool.execute('SELECT COUNT(*) as total FROM mascota');
            return rows[0].total;
        } catch (error) {
            console.error('Error en Mascota.count:', error);
            throw new Error('Error al contar mascotas');
        }
    }

    static async paginate(page = 1, limit = 10) {
        try {
            let pageInt = parseInt(page) || 1;
            let limitInt = parseInt(limit) || 10;
            if (pageInt < 1) pageInt = 1;
            if (limitInt < 1) limitInt = 10;
            if (limitInt > 100) limitInt = 100;

            const offset = (pageInt - 1) * limitInt;

            const [rows] = await pool.execute(
                `SELECT idMascota as id, Propietario as propietario, Nombre as nombre, Especie as especie, Raza as raza, Edad as edad FROM vmascota ORDER BY Nombre LIMIT ${limitInt} OFFSET ${offset}`
            );

            const total = await this.count();
            const totalPages = Math.ceil(total / limitInt);

            return {
                mascotas: rows,
                pagination: {
                    currentPage: pageInt,
                    totalPages,
                    totalMascotas: total,
                    hasNextPage: pageInt < totalPages,
                    hasPrevPage: pageInt > 1,
                    limit: limitInt
                }
            };
        } catch (error) {
            console.error('Error en Mascota.paginate:', error);
            throw new Error('Error al paginar mascotas');
        }
    }

    // ===== Propietarios de mascotas desde la vista vproietariosmascota =====

    /**
     * Lista propietarios de mascotas con paginación desde la vista vproietariosmascota
     * @param {number} page
     * @param {number} limit
     * @returns {Promise<{items: Array, pagination: Object}>}
     */
    static async propietariosViewPaginate(page = 1, limit = 10) {
        try {
            let pageInt = parseInt(page) || 1;
            let limitInt = parseInt(limit) || 10;
            if (pageInt < 1) pageInt = 1;
            if (limitInt < 1) limitInt = 10;
            if (limitInt > 100) limitInt = 100;

            const offset = (pageInt - 1) * limitInt;

            const [rows] = await pool.execute(
                `SELECT id, propietario FROM vproietariosmascota ORDER BY propietario LIMIT ${limitInt} OFFSET ${offset}`
            );

            // Contar total de la vista
            const [countRows] = await pool.execute('SELECT COUNT(*) as total FROM vproietariosmascota');
            const total = countRows[0].total;
            const totalPages = Math.ceil(total / limitInt);

            return {
                items: rows,
                pagination: {
                    currentPage: pageInt,
                    totalPages,
                    totalItems: total,
                    hasNextPage: pageInt < totalPages,
                    hasPrevPage: pageInt > 1,
                    limit: limitInt
                }
            };
        } catch (error) {
            console.error('Error en Mascota.propietariosViewPaginate:', error);
            throw new Error('Error al paginar propietarios de mascotas');
        }
    }

    /**
     * Búsqueda general (q/search) en la vista vproietariosmascota
     * - Si el término es numérico, busca por id exacto o propietario LIKE
     * - Si es texto, busca solo por propietario LIKE
     */
    static async propietariosViewSearchTerm(term) {
        try {
            const str = term?.toString().trim();
            if (!str) return [];
            const isNumeric = /^\d+$/.test(str);
            let query;
            let params;
            if (isNumeric) {
                query = 'SELECT id, propietario FROM vproietariosmascota WHERE id = ? OR propietario LIKE ? ORDER BY propietario';
                params = [Number(str), `%${str}%`];
            } else {
                query = 'SELECT id, propietario FROM vproietariosmascota WHERE propietario LIKE ? ORDER BY propietario';
                params = [`%${str}%`];
            }
            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Error en Mascota.propietariosViewSearchTerm:', error);
            throw new Error('Error al buscar propietarios de mascotas');
        }
    }

    /**
     * Búsqueda avanzada por campos en la vista vproietariosmascota
     * Campos válidos: id (exacto), propietario (LIKE). Operador AND.
     */
    static async propietariosViewSearchByFields(fields) {
        try {
            const validFields = ['id', 'propietario'];
            const conditions = [];
            const params = [];

            if (fields && (fields.id !== undefined && fields.id !== null)) {
                const idStr = fields.id.toString().trim();
                if (idStr) {
                    conditions.push('id = ?');
                    params.push(Number(idStr));
                }
            }

            if (fields && (fields.propietario !== undefined && fields.propietario !== null)) {
                const propStr = fields.propietario.toString().trim();
                if (propStr) {
                    conditions.push('propietario LIKE ?');
                    params.push(`%${propStr}%`);
                }
            }

            if (conditions.length === 0) return [];

            const whereClause = conditions.join(' AND ');
            const query = `SELECT id, propietario FROM vproietariosmascota WHERE ${whereClause} ORDER BY propietario`;
            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Error en Mascota.propietariosViewSearchByFields:', error);
            throw new Error('Error al buscar propietarios de mascotas por campos');
        }
    }
}

module.exports = Mascota;
