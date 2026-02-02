/**
 * Modelo de HistorialMedico
 * @description Maneja operaciones CRUD para la entidad HistorialMedico
 *
 * Tabla esperada `historial_medico` con columnas:
 * - idHistorial (INT, PK, autonumerico)
 * - Mascota (INT) -- FK a mascota.idMascota
 * - FechaAtencion (DATETIME)
 * - Motivo (VARCHAR(500))
 * - Diagnostico (VARCHAR(2000))
 */

const { pool } = require('../config/database');

class HistorialMedico {
    /**
     * Convierte una fecha (Date o string ISO) a formato MySQL DATETIME: 'YYYY-MM-DD HH:MM:SS'
     * @param {string|Date} dateInput
     * @returns {string} fecha en formato compatible con MySQL DATETIME
     */
    static _formatDateForMySQL(dateInput) {
        const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
        if (Number.isNaN(d.getTime())) {
            throw new Error('Fecha inválida');
        }
        // Formatear en hora local: YYYY-MM-DD HH:MM:SS
        const pad = (n) => String(n).padStart(2, '0');
        const year = d.getFullYear();
        const month = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const hours = pad(d.getHours());
        const minutes = pad(d.getMinutes());
        const seconds = pad(d.getSeconds());
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    constructor(data) {
        this.id = data.id;
        this.mascota = data.mascota;
        this.fechaAtencion = data.fechaAtencion;
        this.motivo = data.motivo;
        this.diagnostico = data.diagnostico;
    }

    static async findAll() {
        try {
            const [rows] = await pool.execute(
                'SELECT idHistorial as id, Mascota as mascota, FechaAtencion as fechaAtencion, Motivo as motivo, Diagnostico as diagnostico FROM vhistorial_medico ORDER BY FechaAtencion DESC'
            );
            return rows;
        } catch (error) {
            console.error('Error en HistorialMedico.findAll:', error);
            throw new Error('Error al obtener historiales');
        }
    }

    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT idHistorial as id, Mascota as mascota, FechaAtencion as fechaAtencion, Motivo as motivo, Diagnostico as diagnostico FROM vhistorial_medico WHERE idHistorial = ?',
                [id]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en HistorialMedico.findById:', error);
            throw new Error('Error al buscar historial por ID');
        }
    }

    static async create(data) {
        try {
            const { mascota, fechaAtencion, motivo, diagnostico } = data;
            // Normalizar fecha a formato MySQL DATETIME
            const fecha = fechaAtencion ? HistorialMedico._formatDateForMySQL(fechaAtencion) : HistorialMedico._formatDateForMySQL(new Date());
            const [result] = await pool.execute(
                'INSERT INTO historial_medico (Mascota, FechaAtencion, Motivo, Diagnostico) VALUES (?, ?, ?, ?)',
                [mascota, fecha, motivo, diagnostico]
            );

            const newRecord = await this.findById(result.insertId);
            return newRecord;
        } catch (error) {
            console.error('Error en HistorialMedico.create:', error);
            throw new Error('Error al crear historial medico');
        }
    }

    static async update(id, data) {
        try {
            const { mascota, fechaAtencion, motivo, diagnostico } = data;
            // Si se proporciona fechaAtencion, convertirla al formato MySQL
            const fecha = fechaAtencion !== undefined && fechaAtencion !== null
                ? HistorialMedico._formatDateForMySQL(fechaAtencion)
                : fechaAtencion; // dejar undefined/null para que el controlador pueda manejarlo si es necesario

            const query = 'UPDATE historial_medico SET Mascota = ?, FechaAtencion = ?, Motivo = ?, Diagnostico = ? WHERE idHistorial = ?';
            const params = [mascota, fecha, motivo, diagnostico, id];

            const [result] = await pool.execute(query, params);
            if (result.affectedRows === 0) return null;

            return await this.findById(id);
        } catch (error) {
            console.error('Error en HistorialMedico.update:', error);
            throw new Error('Error al actualizar historial medico');
        }
    }

    static async delete(id) {
        try {
            const [result] = await pool.execute('DELETE FROM historial_medico WHERE idHistorial = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en HistorialMedico.delete:', error);
            throw new Error('Error al eliminar historial medico');
        }
    }

    static async searchByTerm(term) {
        try {
            const [rows] = await pool.execute(
                'SELECT idHistorial as id, Mascota as mascota, FechaAtencion as fechaAtencion, Motivo as motivo, Diagnostico as diagnostico FROM vhistorial_medico WHERE Motivo LIKE ? OR Diagnostico LIKE ? ORDER BY FechaAtencion DESC',
                [`%${term}%`, `%${term}%`]
            );
            return rows;
        } catch (error) {
            console.error('Error en HistorialMedico.searchByTerm:', error);
            throw new Error('Error al buscar historiales');
        }
    }

    /**
     * Búsqueda avanzada por múltiples campos (AND)
     * - Texto (LIKE): motivo, diagnostico
     * - Exacto (=): mascota, fechaAtencion (formato 'YYYY-MM-DD HH:MM:SS' o prefijo permitido usando LIKE si termina con %)
     * @param {Object} searchFields
     * @returns {Promise<Array>}
     */
    static async searchByFields(searchFields) {
        try {
            const validFields = ['mascota', 'fechaAtencion', 'motivo', 'diagnostico', 'fechaDesde', 'fechaHasta'];
            const fieldMappings = {
                mascota: 'Mascota',
                fechaAtencion: 'FechaAtencion',
                motivo: 'Motivo',
                diagnostico: 'Diagnostico'
            };

            const textFields = ['motivo', 'diagnostico'];
            const exactFields = ['mascota', 'fechaAtencion'];

            const conditions = [];
            const params = [];

            // Manejo especial de rango de fechas antes de recorrer campos regulares
            const hasDesde = searchFields && searchFields.fechaDesde !== undefined && searchFields.fechaDesde !== null && String(searchFields.fechaDesde).trim() !== '';
            const hasHasta = searchFields && searchFields.fechaHasta !== undefined && searchFields.fechaHasta !== null && String(searchFields.fechaHasta).trim() !== '';
            if (hasDesde || hasHasta) {
                try {
                    if (hasDesde) {
                        const from = HistorialMedico._formatDateForMySQL(searchFields.fechaDesde);
                        conditions.push('FechaAtencion >= ?');
                        params.push(from);
                    }
                    if (hasHasta) {
                        const to = HistorialMedico._formatDateForMySQL(searchFields.fechaHasta);
                        conditions.push('FechaAtencion <= ?');
                        params.push(to);
                    }
                } catch (e) {
                    console.error('Error formateando rango de fechas:', e);
                    throw new Error('Rango de fechas inválido');
                }
            }

            for (const [field, value] of Object.entries(searchFields || {})) {
                if (!validFields.includes(field)) continue;
                if (value === undefined || value === null) continue;
                const str = value.toString().trim();
                if (!str) continue;

                const dbField = fieldMappings[field];
                if (textFields.includes(field)) {
                    conditions.push(`${dbField} LIKE ?`);
                    params.push(`%${str}%`);
                } else if (exactFields.includes(field)) {
                    // Si el usuario pasa comodín manual (termina con %), permitir LIKE
                    if (str.endsWith('%')) {
                        conditions.push(`${dbField} LIKE ?`);
                        params.push(str);
                    } else {
                        conditions.push(`${dbField} = ?`);
                        params.push(str);
                    }
                } else if (field === 'fechaDesde' || field === 'fechaHasta') {
                    // Ya manejado arriba; ignorar aquí
                    continue;
                }
            }

            if (conditions.length === 0) return [];

            const whereClause = conditions.join(' AND ');
            const query = `
                SELECT idHistorial as id, Mascota as mascota, FechaAtencion as fechaAtencion, Motivo as motivo, Diagnostico as diagnostico
                FROM vhistorial_medico
                WHERE ${whereClause}
                ORDER BY FechaAtencion DESC
            `;
            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Error en HistorialMedico.searchByFields:', error);
            throw new Error('Error al buscar historiales por campos');
        }
    }

    static async count() {
        try {
            const [rows] = await pool.execute('SELECT COUNT(*) as total FROM historial_medico');
            return rows[0].total;
        } catch (error) {
            console.error('Error en HistorialMedico.count:', error);
            throw new Error('Error al contar historiales');
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
                `SELECT idHistorial as id, Mascota as mascota, FechaAtencion as fechaAtencion, Motivo as motivo, Diagnostico as diagnostico FROM vhistorial_medico ORDER BY FechaAtencion DESC LIMIT ${limitInt} OFFSET ${offset}`
            );

            const total = await this.count();
            const totalPages = Math.ceil(total / limitInt);

            return {
                historiales: rows,
                pagination: {
                    currentPage: pageInt,
                    totalPages,
                    totalHistoriales: total,
                    hasNextPage: pageInt < totalPages,
                    hasPrevPage: pageInt > 1,
                    limit: limitInt
                }
            };
        } catch (error) {
            console.error('Error en HistorialMedico.paginate:', error);
            throw new Error('Error al paginar historiales');
        }
    }
}

module.exports = HistorialMedico;
