/**
 * Modelo de Usuario
 * @description Maneja todas las operaciones CRUD para la entidad Usuario
 */

const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const { DEFAULT_CLIENT_PASSWORD } = require('../constants/security');

/**
 * Clase que representa el modelo de Usuario
 */
class User {
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
            'El correo ya está registrado en otro usuario': { status: 409, code: 'EMAIL_ALREADY_EXISTS_OTHER_USER' }
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
     * Convierte una fecha (Date o string ISO) a formato MySQL DATETIME: 'YYYY-MM-DD HH:MM:SS'
     * @param {string|Date} dateInput
     * @returns {string}
     */
    static _formatDateForMySQL(dateInput) {
        const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
        if (Number.isNaN(d.getTime())) {
            throw new Error('Fecha inválida');
        }
        const pad = (n) => String(n).padStart(2, '0');
        const year = d.getFullYear();
        const month = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const hours = pad(d.getHours());
        const minutes = pad(d.getMinutes());
        const seconds = pad(d.getSeconds());
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    /**
     * Constructor para crear una instancia de Usuario
     * @param {Object} userData - Datos del usuario
     * @param {number} userData.id - ID del usuario
     * @param {string} userData.nombre - Nombre del usuario
     * @param {string} userData.email - Email del usuario
     * @param {string} userData.telefono - Teléfono del usuario
     * @param {string} userData.password - Contraseña hasheada del usuario
     * @param {Date} userData.fecha_creacion - Fecha de creación
     * @param {Date} userData.fecha_actualizacion - Fecha de actualización
     */
    constructor(userData) {
        this.id = userData.id;
        this.nombre = userData.nombre;
        this.email = userData.email;
        this.telefono = userData.telefono;
        this.tipo_Usuario = userData.tipo_Usuario ?? userData.tipo_usuario;
        this.password = userData.password;
        this.fecha_creacion = userData.fecha_creacion;
        this.fecha_actualizacion = userData.fecha_actualizacion;
    }

    /**
     * Obtiene todos los usuarios de la base de datos
     * @returns {Promise<Array>} Array de usuarios
     */
    static async findAll() {
        try {
            const [rows] = await pool.execute(
                'SELECT id, nombre, email, telefono, tipo_usuario AS tipo_Usuario, fecha_creacion, fecha_actualizacion FROM usuarios ORDER BY fecha_creacion DESC'
            );
            return rows;
        } catch (error) {
            console.error('Error en User.findAll:', error);
            throw new Error('Error al obtener usuarios');
        }
    }

    /**
     * Busca un usuario por su ID
     * @param {number} id - ID del usuario
     * @returns {Promise<Object|null>} Usuario encontrado o null
     */
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT id, nombre, email, telefono, tipo_usuario AS tipo_Usuario, fecha_creacion, fecha_actualizacion FROM usuarios WHERE id = ?',
                [id]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en User.findById:', error);
            throw new Error('Error al buscar usuario por ID');
        }
    }

    /**
     * Busca un usuario por su email
     * @param {string} email - Email del usuario
     * @returns {Promise<Object|null>} Usuario encontrado o null
     */
    static async findByEmail(email) {
        try {
            const [rows] = await pool.execute(
                'SELECT id, nombre, email, telefono, tipo_usuario AS tipo_Usuario, fecha_creacion, fecha_actualizacion FROM usuarios WHERE email = ?',
                [email]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en User.findByEmail:', error);
            throw new Error('Error al buscar usuario por email');
        }
    }

    /**
     * Crea un nuevo usuario en la base de datos
     * @param {Object} userData - Datos del usuario
     * @param {string} userData.nombre - Nombre del usuario
     * @param {string} userData.email - Email del usuario
     * @param {string} userData.telefono - Teléfono del usuario
     * @param {string} userData.password - Contraseña hasheada del usuario
     * @returns {Promise<Object>} Usuario creado
     */
    static async create(userData) {
        try {
            const { nombre, email, telefono, password, tipo_Usuario } = userData;
            
            const [result] = await pool.execute(
                'INSERT INTO usuarios (nombre, email, telefono, tipo_usuario, password, fecha_creacion, fecha_actualizacion) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
                [nombre, email, telefono, tipo_Usuario, password]
            );

            // Obtener el usuario recién creado (sin contraseña)
            const newUser = await this.findById(result.insertId);
            if (newUser) {
                delete newUser.password; // No devolver la contraseña
            }
            return newUser;
        } catch (error) {
            console.error('Error en User.create:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                throw this.buildAppError('El email ya está registrado', 409, 'EMAIL_ALREADY_EXISTS');
            }
            throw this.buildAppError('Error al crear usuario', 500, 'USER_CREATE_ERROR');
        }
    }

    /**
     * Actualiza un usuario existente
     * @param {number} id - ID del usuario
     * @param {Object} userData - Datos a actualizar
     * @returns {Promise<Object|null>} Usuario actualizado o null
     */
    static async update(id, userData) {
        try {
            const { nombre, email, telefono, password, tipo_Usuario } = userData;
            
            let query = 'UPDATE usuarios SET nombre = ?, email = ?, telefono = ?';
            let params = [nombre, email, telefono];

            if (tipo_Usuario) {
                query += ', tipo_usuario = ?';
                params.push(tipo_Usuario);
            }
            query += ', fecha_actualizacion = NOW()';
            
            // Si se proporciona una nueva contraseña, incluirla en la actualización
            if (password) {
                query += ', password = ?';
                params.push(password);
            }
            
            query += ' WHERE id = ?';
            params.push(id);
            
            const [result] = await pool.execute(query, params);

            if (result.affectedRows === 0) {
                return null;
            }

            // Obtener el usuario actualizado (sin contraseña)
            const updatedUser = await this.findById(id);
            if (updatedUser) {
                delete updatedUser.password;
            }
            return updatedUser;
        } catch (error) {
            console.error('Error en User.update:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                throw this.buildAppError('El email ya está registrado', 409, 'EMAIL_ALREADY_EXISTS');
            }
            throw this.buildAppError('Error al actualizar usuario', 500, 'USER_UPDATE_ERROR');
        }
    }

    /**
     * Sincroniza el correo entre usuario y propietario usando el SP
     * @param {number} usuarioId - ID del usuario
     * @param {string} nuevoCorreo - Nuevo correo a sincronizar
     * @returns {Promise<void>}
     */
    static async syncCorreo(usuarioId, nuevoCorreo) {
        try {
            await pool.execute('CALL sp_sincronizar_correo(?, ?)', [usuarioId, nuevoCorreo]);
        } catch (error) {
            console.error('Error en User.syncCorreo:', error);
            const spError = this.mapStoredProcedureError(error);
            if (spError) {
                throw spError;
            }
            throw new Error('Error al sincronizar correo');
        }
    }

    /**
     * Sincroniza nombre y teléfono del usuario a partir del propietario
     * @param {number} usuarioId - ID del usuario
     * @param {string} nombre - Nombre completo del usuario
     * @param {string} telefono - Teléfono del usuario
     * @returns {Promise<void>}
     */
    static async syncNombreTelefono(usuarioId, nombre, telefono) {
        try {
            await pool.execute(
                'UPDATE usuarios SET nombre = ?, telefono = ?, fecha_actualizacion = NOW() WHERE id = ?',
                [nombre, telefono, usuarioId]
            );
        } catch (error) {
            console.error('Error en User.syncNombreTelefono:', error);
            throw new Error('Error al sincronizar nombre y teléfono del usuario');
        }
    }

    /**
     * Busca un usuario por email para autenticación (incluye password)
     * @param {string} email - Email del usuario
     * @returns {Promise<Object|null>} Usuario encontrado con password o null
     */
    static async findByEmailWithPassword(email) {
        try {
            const [rows] = await pool.execute(
                'SELECT id, nombre, email, telefono, tipo_usuario AS tipo_Usuario, password, fecha_creacion, fecha_actualizacion FROM usuarios WHERE email = ?',
                [email]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en User.findByEmailWithPassword:', error);
            throw new Error('Error al buscar usuario por email');
        }
    }

    /**
     * Busca un usuario por ID para autenticación/validación (incluye password)
     * @param {number} id - ID del usuario
     * @returns {Promise<Object|null>} Usuario encontrado con password o null
     */
    static async findByIdWithPassword(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT id, nombre, email, telefono, tipo_usuario AS tipo_Usuario, password, fecha_creacion, fecha_actualizacion FROM usuarios WHERE id = ?',
                [id]
            );
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en User.findByIdWithPassword:', error);
            throw new Error('Error al buscar usuario por ID');
        }
    }

    /**
     * Resetea la contraseña de un usuario al valor por defecto del sistema
     * @param {number} id - ID del usuario
     * @returns {Promise<boolean>} true si se actualizó correctamente
     */
    static async resetPasswordToDefault(id) {
        try {
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(DEFAULT_CLIENT_PASSWORD, saltRounds);

            const [result] = await pool.execute(
                'UPDATE usuarios SET password = ?, fecha_actualizacion = NOW() WHERE id = ?',
                [hashedPassword, id]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en User.resetPasswordToDefault:', error);
            throw new Error('Error al resetear contraseña del usuario');
        }
    }

    /**
     * Elimina un usuario por su ID
     * @param {number} id - ID del usuario
     * @returns {Promise<boolean>} True si se eliminó correctamente
     */
    static async delete(id) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM usuarios WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en User.delete:', error);
            throw new Error('Error al eliminar usuario');
        }
    }

    /**
     * Busca usuarios por nombre (búsqueda parcial)
     * @param {string} nombre - Nombre a buscar
     * @returns {Promise<Array>} Array de usuarios encontrados
     */
    static async searchByName(nombre) {
        try {
            // Búsqueda general SOLO por nombre (parcial)
            const term = nombre?.toString().trim() || '';
            const like = `%${term}%`;
            const [rows] = await pool.execute(
                'SELECT id, nombre, email, telefono, tipo_usuario AS tipo_Usuario, fecha_creacion, fecha_actualizacion FROM usuarios WHERE nombre LIKE ? ORDER BY nombre',
                [like]
            );
            return rows;
        } catch (error) {
            console.error('Error en User.searchByName:', error);
            throw new Error('Error al buscar usuarios por nombre');
        }
    }

    /**
     * Busca usuarios por múltiples campos dinámicamente
     * @param {Object} searchFields - Campos a filtrar: { id, nombre, email, telefono }
     * @returns {Promise<Array>} Resultados que cumplen TODOS los filtros (AND)
     */
    static async searchByFields(searchFields) {
        try {
            const validFields = ['id', 'nombre', 'email', 'telefono', 'fecha_creacion', 'fechaDesde', 'fechaHasta'];
            const textFields = ['nombre', 'email', 'telefono'];
            const exactFields = ['fecha_creacion'];

            const conditions = [];
            const params = [];

            // Manejo especial de rango de fechas (fecha_creacion)
            const hasDesde = searchFields && searchFields.fechaDesde !== undefined && searchFields.fechaDesde !== null && String(searchFields.fechaDesde).trim() !== '';
            const hasHasta = searchFields && searchFields.fechaHasta !== undefined && searchFields.fechaHasta !== null && String(searchFields.fechaHasta).trim() !== '';
            if (hasDesde || hasHasta) {
                try {
                    if (hasDesde) {
                        const from = User._formatDateForMySQL(searchFields.fechaDesde);
                        conditions.push('fecha_creacion >= ?');
                        params.push(from);
                    }
                    if (hasHasta) {
                        const to = User._formatDateForMySQL(searchFields.fechaHasta);
                        conditions.push('fecha_creacion <= ?');
                        params.push(to);
                    }
                } catch (e) {
                    console.error('Error formateando rango de fechas (usuarios):', e);
                    throw new Error('Rango de fechas inválido');
                }
            }

            for (const [field, raw] of Object.entries(searchFields || {})) {
                if (!validFields.includes(field)) continue;
                if (raw === undefined || raw === null) continue;
                const value = raw.toString().trim();
                if (!value) continue;

                if (field === 'id') {
                    conditions.push('id = ?');
                    params.push(parseInt(value));
                } else if (textFields.includes(field)) {
                    conditions.push(`${field} LIKE ?`);
                    params.push(`%${value}%`);
                } else if (exactFields.includes(field)) {
                    // Permitir comodín manual con sufijo % para LIKE
                    if (value.endsWith('%')) {
                        conditions.push(`${field} LIKE ?`);
                        params.push(value);
                    } else {
                        conditions.push(`${field} = ?`);
                        params.push(value);
                    }
                }
            }

            if (conditions.length === 0) return [];

            const where = conditions.join(' AND ');
            const sql = `SELECT id, nombre, email, telefono, tipo_usuario AS tipo_Usuario, fecha_creacion, fecha_actualizacion FROM usuarios WHERE ${where} ORDER BY nombre`;
            const [rows] = await pool.execute(sql, params);
            return rows;
        } catch (error) {
            console.error('Error en User.searchByFields:', error);
            throw new Error('Error al buscar usuarios por campos específicos');
        }
    }

    /**
     * Cuenta el total de usuarios
     * @returns {Promise<number>} Número total de usuarios
     */
    static async count() {
        try {
            const [rows] = await pool.execute('SELECT COUNT(*) as total FROM usuarios');
            return rows[0].total;
        } catch (error) {
            console.error('Error en User.count:', error);
            throw new Error('Error al contar usuarios');
        }
    }

    /**
     * Obtiene usuarios con paginación
     * @param {number} page - Número de página (empezando en 1)
     * @param {number} limit - Límite de usuarios por página
     * @returns {Promise<Object>} Objeto con usuarios y metadatos de paginación
     */
    static async paginate(page = 1, limit = 10) {
        try {
            // Asegurar que page y limit sean números enteros válidos
            let pageInt = parseInt(page) || 1;
            let limitInt = parseInt(limit) || 10;
            if (pageInt < 1) pageInt = 1;
            if (limitInt < 1) limitInt = 10;
            if (limitInt > 100) limitInt = 100; // Límite máximo
            const offset = (pageInt - 1) * limitInt;

            // Obtener usuarios paginados usando interpolación directa
            const [users] = await pool.execute(
                `SELECT id, nombre, email, telefono, tipo_usuario AS tipo_Usuario, fecha_creacion, fecha_actualizacion FROM usuarios ORDER BY fecha_creacion DESC LIMIT ${limitInt} OFFSET ${offset}`
            );

            // Obtener total de usuarios
            const total = await this.count();
            const totalPages = Math.ceil(total / limitInt);

            return {
                users,
                pagination: {
                    currentPage: pageInt,
                    totalPages,
                    totalUsers: total,
                    hasNextPage: pageInt < totalPages,
                    hasPrevPage: pageInt > 1,
                    limit: limitInt
                }
            };
        } catch (error) {
            console.error('Error en User.paginate:', error);
            console.error('Detalles del error:', error.stack);
            throw new Error('Error al paginar usuarios');
        }
    }
}

module.exports = User;