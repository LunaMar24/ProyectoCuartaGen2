/**
 * Modelo de Propietario
 * @description Maneja todas las operaciones CRUD para la entidad Propietario
 *
 * Nota: Este archivo asume que existe la tabla `propietarios` con las columnas:
 * - idPropietario (INT, PK)
 * - Nombre (VARCHAR)
 * - Apellidos (VARCHAR)
 * - Cedula (VARCHAR)
 * - Telefono (VARCHAR)
 * - Correo (VARCHAR)
 * (No se incluyen columnas de fecha; el modelo sigue la estructura provista en la imagen)
 */

const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class Propietario {
    /**
     * Crea un error de aplicación con metadatos HTTP
     * @param {string} message - Mensaje de error
     * @param {number} status - Código HTTP sugerido
     * @param {string} code - Código interno de error
     * @returns {Error}
     */
    static buildAppError(message, status, code) {
        const appError = new Error(message);
        appError.status = status;
        appError.code = code;
        return appError;
    }

    /**
     * Mapea errores SIGNAL (SQLSTATE 45000) de SP a errores de aplicación
     * @param {Object} error - Error original de mysql2
     * @returns {Error|null}
     */
    static mapStoredProcedureError(error) {
        const isSignalError = error && (error.code === 'ER_SIGNAL_EXCEPTION' || error.sqlState === '45000');
        if (!isSignalError) return null;

        const signalMessage = (error.sqlMessage || error.message || '').trim();

        const mappedErrors = {
            'El correo ya está registrado en usuarios': { status: 409, code: 'EMAIL_ALREADY_EXISTS_USERS' },
            'El correo ya está registrado en propietarios': { status: 409, code: 'EMAIL_ALREADY_EXISTS_PROPIETARIOS' },
            'La cédula ya está registrada': { status: 409, code: 'CEDULA_ALREADY_EXISTS' },
            'El propietario no existe': { status: 404, code: 'PROPIETARIO_NOT_FOUND' }
        };

        const mapped = mappedErrors[signalMessage];
        if (mapped) {
            return this.buildAppError(signalMessage, mapped.status, mapped.code);
        }

        return this.buildAppError(
            signalMessage || 'Error de validación en procedimiento almacenado',
            400,
            'SP_VALIDATION_ERROR'
        );
    }

    /**
     * Extrae el id del propietario desde el resultado de un CALL a SP
     * @param {any} spResult - Resultado devuelto por mysql2 para el SP
     * @returns {number|null}
     */
    static extractPropietarioIdFromSpResult(spResult) {
        const candidateKeys = ['idPropietario', 'id_propietario', 'propietarioId', 'id'];

        const toValidId = (value) => {
            const parsed = Number(value);
            return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
        };

        if (Array.isArray(spResult)) {
            for (const item of spResult) {
                const id = this.extractPropietarioIdFromSpResult(item);
                if (id) return id;
            }
            return null;
        }

        if (spResult && typeof spResult === 'object') {
            for (const key of candidateKeys) {
                if (Object.prototype.hasOwnProperty.call(spResult, key)) {
                    const id = toValidId(spResult[key]);
                    if (id) return id;
                }
            }
        }

        return null;
    }

    /**
     * Constructor para crear una instancia de Propietario
     * @param {Object} propData - Datos del propietario
     * @param {number} propData.id - ID del propietario
     * @param {string} propData.nombre - Nombre
     * @param {string} propData.apellidos - Apellidos
     * @param {string} propData.cedula - Cédula
     * @param {string} propData.telefono - Teléfono
     * @param {string} propData.correo - Correo electrónico
     * @param {number} propData.usuarioId - ID del usuario relacionado
     */
    constructor(propData) {
        this.id = propData.id;
        this.nombre = propData.nombre;
        this.apellidos = propData.apellidos;
        this.cedula = propData.cedula;
        this.telefono = propData.telefono;
        this.correo = propData.correo;
            this.usuarioId = propData.usuarioId;
    }

    /**
     * Obtiene todos los propietarios de la base de datos
     * @returns {Promise<Array>} Array de propietarios
     */
    static async findAll() {
        try {
            const [rows] = await pool.execute(
                'SELECT idPropietario as id, Nombre as nombre, Apellidos as apellidos, Cedula as cedula, Telefono as telefono, Correo as correo, usuarioId as usuarioId FROM propietario ORDER BY Nombre'
            );
            return rows;
        } catch (error) {
            console.error('Error en Propietario.findAll:', error);
            throw new Error('Error al obtener propietarios');
        }
    }

    /**
     * Busca un propietario por su ID
     * @param {number} id - ID del propietario
     * @returns {Promise<Object|null>} Propietario encontrado o null
     */
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT idPropietario as id, Nombre as nombre, Apellidos as apellidos, Cedula as cedula, Telefono as telefono, Correo as correo, usuarioId as usuarioId FROM propietario WHERE idPropietario = ?',
                [id]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en Propietario.findById:', error);
            throw new Error('Error al buscar propietario por ID');
        }
    }

    /**
     * Busca un propietario por su usuarioId
     * @param {number} usuarioId - ID del usuario asociado
     * @returns {Promise<Object|null>} Propietario encontrado o null
     */
    static async findByUsuarioId(usuarioId) {
        try {
            const [rows] = await pool.execute(
                'SELECT idPropietario as id, Nombre as nombre, Apellidos as apellidos, Cedula as cedula, Telefono as telefono, Correo as correo, usuarioId as usuarioId FROM propietario WHERE usuarioId = ?',
                [usuarioId]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en Propietario.findByUsuarioId:', error);
            throw new Error('Error al buscar propietario por usuarioId');
        }
    }

    /**
     * Crea un nuevo propietario en la base de datos
     * @param {Object} propData - Datos del propietario
     * @param {string} propData.nombre - Nombre
     * @param {string} propData.apellidos - Apellidos
     * @param {string} propData.cedula - Cédula
     * @param {string} propData.telefono - Teléfono
     * @param {string} propData.correo - Correo electrónico
     * @returns {Promise<Object>} Propietario creado
     */
    static async create(propData) {
        try {
            const { nombre, apellidos, cedula, telefono, correo } = propData;
            const defaultPassword = 'Password@1';
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

            const [spResult] = await pool.execute(
                'CALL sp_crear_usuario_y_propietario(?, ?, ?, ?, ?, ?)',
                [nombre, apellidos, cedula, correo, telefono, hashedPassword]
            );

            const propietarioId = this.extractPropietarioIdFromSpResult(spResult);
            if (!propietarioId) {
                throw new Error('No se recibió el id del propietario creado desde el SP');
            }

            const newProp = await this.findById(propietarioId);
            return newProp;
        } catch (error) {
            console.error('Error en Propietario.create:', error);
            const spError = this.mapStoredProcedureError(error);
            if (spError) {
                throw spError;
            }
            if (error.code === 'ER_DUP_ENTRY') {
                throw this.buildAppError('Entrada duplicada', 409, 'DUPLICATE_ENTRY');
            }
            throw new Error('Error al crear propietario');
        }
    }

    /**
     * Actualiza un propietario existente
     * @param {number} id - ID del propietario
     * @param {Object} propData - Datos a actualizar
     * @returns {Promise<Object|null>} Propietario actualizado o null
     */
    static async update(id, propData) {
        try {
            const { nombre, apellidos, cedula, telefono, correo, usuarioId } = propData;

            let query = 'UPDATE propietario SET Nombre = ?, Apellidos = ?, Cedula = ?, Telefono = ?, Correo = ?, usuarioId = ? WHERE idPropietario = ?';
            const params = [nombre, apellidos, cedula, telefono, correo, usuarioId, id];

            const [result] = await pool.execute(query, params);

            if (result.affectedRows === 0) {
                return null;
            }

            const updated = await this.findById(id);
            return updated;
        } catch (error) {
            console.error('Error en Propietario.update:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Entrada duplicada');
            }
            throw new Error('Error al actualizar propietario');
        }
    }

    /**
     * Elimina un propietario por su ID
     * @param {number} id - ID del propietario
     * @returns {Promise<boolean>} True si se eliminó correctamente
     */
    static async delete(id) {
        try {
            await pool.execute('CALL sp_eliminar_propietario(?)', [id]);
            return true;
        } catch (error) {
            console.error('Error en Propietario.delete:', error);
            const spError = this.mapStoredProcedureError(error);
            if (spError) {
                throw spError;
            }
            throw new Error('Error al eliminar propietario');
        }
    }

    /**
     * Busca propietarios por nombre o apellido (búsqueda parcial)
     * @param {string} nombre - Nombre o apellido a buscar
     * @returns {Promise<Array>} Array de propietarios encontrados
     */
    static async searchByName(nombre) {
        try {
            const [rows] = await pool.execute(
                'SELECT idPropietario as id, Nombre as nombre, Apellidos as apellidos, Cedula as cedula, Telefono as telefono, Correo as correo, usuarioId as usuarioId FROM propietario WHERE Nombre LIKE ? OR Apellidos LIKE ? ORDER BY Nombre',
                [`%${nombre}%`, `%${nombre}%`]
            );
            return rows;
        } catch (error) {
            console.error('Error en Propietario.searchByName:', error);
            throw new Error('Error al buscar propietarios por nombre');
        }
    }

    /**
     * Busca propietarios por múltiples campos dinámicamente
     * @param {Object} searchFields - Objeto con los campos a buscar
     * @returns {Promise<Array>} Array de propietarios encontrados
     */
    static async searchByFields(searchFields) {
        try {
            const validFields = ['nombre', 'apellidos', 'cedula', 'telefono', 'correo', 'usuarioId'];
            const fieldMappings = {
                'nombre': 'Nombre',
                'apellidos': 'Apellidos', 
                'cedula': 'Cedula',
                'telefono': 'Telefono',
                'correo': 'Correo',
                'usuarioId': 'usuarioId'
            };

            // Campos de texto (búsqueda parcial) vs campos exactos
            const textFields = ['nombre', 'apellidos', 'correo', 'cedula', 'telefono'];
            const exactFields = ['usuarioId'];

            const conditions = [];
            const params = [];

            for (const [field, value] of Object.entries(searchFields)) {
                if (validFields.includes(field) && value && value.toString().trim()) {
                    const dbField = fieldMappings[field];
                    const cleanValue = value.toString().trim();

                    if (textFields.includes(field)) {
                        // Búsqueda parcial para campos de texto
                        conditions.push(`${dbField} LIKE ?`);
                        params.push(`%${cleanValue}%`);
                    } else if (exactFields.includes(field)) {
                        // Búsqueda exacta para cédula y teléfono
                        conditions.push(`${dbField} = ?`);
                        params.push(cleanValue);
                    }
                }
            }

            if (conditions.length === 0) {
                return [];
            }

            const whereClause = conditions.join(' AND ');
            const query = `
                SELECT idPropietario as id, Nombre as nombre, Apellidos as apellidos, 
                       Cedula as cedula, Telefono as telefono, Correo as correo, usuarioId as usuarioId 
                FROM propietario 
                WHERE ${whereClause} 
                ORDER BY Nombre, Apellidos
            `;

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Error en Propietario.searchByFields:', error);
            throw new Error('Error al buscar propietarios por campos específicos');
        }
    }

    /**
     * Cuenta el total de propietarios
     * @returns {Promise<number>} Número total de propietarios
     */
    static async count() {
        try {
            const [rows] = await pool.execute('SELECT COUNT(*) as total FROM propietario');
            return rows[0].total;
        } catch (error) {
            console.error('Error en Propietario.count:', error);
            throw new Error('Error al contar propietarios');
        }
    }

    /**
     * Obtiene propietarios con paginación
     * @param {number} page - Número de página (empezando en 1)
     * @param {number} limit - Límite de propietarios por página
     * @returns {Promise<Object>} Objeto con propietarios y metadatos de paginación
     */
    static async paginate(page = 1, limit = 10) {
        try {
            let pageInt = parseInt(page) || 1;
            const limitInt = parseInt(limit) || 10;
            const offset = (pageInt - 1) * limitInt;

            if (pageInt < 1) pageInt = 1;
            if (limitInt < 1) limitInt = 10;
            if (limitInt > 100) limitInt = 100;

            const [props] = await pool.execute(
                `SELECT idPropietario as id, Nombre as nombre, Apellidos as apellidos, Cedula as cedula, Telefono as telefono, Correo as correo, usuarioId as usuarioId FROM propietario ORDER BY Nombre LIMIT ${limitInt} OFFSET ${offset}`
            );

            const total = await this.count();
            const totalPages = Math.ceil(total / limitInt);

            return {
                propietarios: props,
                pagination: {
                    currentPage: pageInt,
                    totalPages,
                    totalPropietarios: total,
                    hasNextPage: pageInt < totalPages,
                    hasPrevPage: pageInt > 1,
                    limit: limitInt
                }
            };
        } catch (error) {
            console.error('Error en Propietario.paginate:', error);
            console.error('Detalles del error:', error.stack);
            throw new Error('Error al paginar propietarios');
        }
    }
}

module.exports = Propietario;
