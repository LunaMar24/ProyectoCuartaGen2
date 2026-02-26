/**
 * Modelo de Citas
 * @description Maneja operaciones de reserva temporal y confirmación de citas
 */

const { pool } = require('../config/database');

class Cita {
    static toMySQLDateTime(dateValue) {
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) {
            throw this.buildAppError('Formato de fecha inválido', 400, 'INVALID_DATETIME_INPUT');
        }
        return date.toISOString().slice(0, 19).replace('T', ' ');
    }

    static buildAppError(message, status, code) {
        const appError = new Error(message);
        appError.status = status;
        appError.code = code;
        return appError;
    }

    static mapStoredProcedureError(error) {
        const isSignalError = error && (error.code === 'ER_SIGNAL_EXCEPTION' || error.sqlState === '45000');
        if (!isSignalError) return null;

        const signalMessage = (error.sqlMessage || error.message || '').trim();

        const mappedErrors = {
            'Rango de fecha inválido': { status: 400, code: 'INVALID_DATE_RANGE' },
            'No se permiten reservas que crucen de día': { status: 400, code: 'CROSS_DAY_NOT_ALLOWED' },
            'Fuera de horario laboral': { status: 400, code: 'OUTSIDE_WORKING_HOURS' },
            'Ya existe una cita en ese rango': { status: 409, code: 'SLOT_ALREADY_BOOKED' },
            'Ya existe una reserva activa en ese rango': { status: 409, code: 'SLOT_ALREADY_RESERVED' },
            'La mascota ya tiene una cita ese día': { status: 409, code: 'PET_ALREADY_HAS_APPOINTMENT' },
            'La mascota ya tiene una reserva activa ese día': { status: 409, code: 'PET_ALREADY_HAS_ACTIVE_RESERVATION' },
            'Reserva no existe': { status: 404, code: 'RESERVATION_NOT_FOUND' },
            'La reserva ha expirado': { status: 410, code: 'RESERVATION_EXPIRED' },
            'Usuario no existe': { status: 404, code: 'USER_NOT_FOUND' },
            'La cita no existe': { status: 404, code: 'APPOINTMENT_NOT_FOUND' },
            'La cita no puede cancelarse': { status: 409, code: 'APPOINTMENT_NOT_CANCELLABLE' },
            'No se puede cancelar con menos de 1 hora de anticipación': { status: 409, code: 'CANCEL_TOO_LATE' }
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

    static extractIdFromSpResult(spResult, candidateKeys = []) {
        const toValidId = (value) => {
            const parsed = Number(value);
            return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
        };

        if (Array.isArray(spResult)) {
            for (const item of spResult) {
                const id = this.extractIdFromSpResult(item, candidateKeys);
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

    static async reservarTemporal(data) {
        try {
            const { usuarioId, mascotaId, fechaInicio, fechaFin, timeoutMinutos } = data;
            const fechaInicioMySQL = this.toMySQLDateTime(fechaInicio);
            const fechaFinMySQL = this.toMySQLDateTime(fechaFin);

            const [spResult] = await pool.execute(
                'CALL sp_reservar_cita_temporal(?, ?, ?, ?, ?)',
                [usuarioId, mascotaId, fechaInicioMySQL, fechaFinMySQL, timeoutMinutos]
            );

            const idReserva = this.extractIdFromSpResult(spResult, ['idReserva']);
            if (!idReserva) {
                throw new Error('No se recibió el id de reserva desde el SP');
            }

            return { idReserva };
        } catch (error) {
            console.error('Error en Cita.reservarTemporal:', error);
            const spError = this.mapStoredProcedureError(error);
            if (spError) throw spError;
            if (error.code === 'ER_TRUNCATED_WRONG_VALUE') {
                throw this.buildAppError('Formato de fecha inválido', 400, 'INVALID_DATETIME_INPUT');
            }
            throw new Error('Error al reservar cita temporalmente');
        }
    }

    static async confirmarReserva(data) {
        try {
            const { idReserva, usuarioId, motivo, notas } = data;

            const [spResult] = await pool.execute(
                'CALL sp_confirmar_reserva_y_crear_cita(?, ?, ?, ?)',
                [idReserva, usuarioId, motivo, notas || null]
            );

            const idCita = this.extractIdFromSpResult(spResult, ['idCita']);
            if (!idCita) {
                throw new Error('No se recibió el id de cita desde el SP');
            }

            return { idCita };
        } catch (error) {
            console.error('Error en Cita.confirmarReserva:', error);
            const spError = this.mapStoredProcedureError(error);
            if (spError) throw spError;
            throw new Error('Error al confirmar reserva y crear cita');
        }
    }

    static async cancelarCita(data) {
        try {
            const { idCita, usuarioId } = data;

            await pool.execute('CALL sp_cancelar_cita(?, ?)', [idCita, usuarioId]);

            return { idCita };
        } catch (error) {
            console.error('Error en Cita.cancelarCita:', error);
            const spError = this.mapStoredProcedureError(error);
            if (spError) throw spError;
            throw new Error('Error al cancelar cita');
        }
    }

    static async marcarConfirmada(data) {
        try {
            const { idCita, usuarioId } = data;

            const [result] = await pool.execute(
                `UPDATE citas
                 SET estado = 'F',
                     modificada_por = ?
                 WHERE idCita = ?
                   AND estado = 'P'`,
                [usuarioId, idCita]
            );

            if (!result || result.affectedRows === 0) {
                const [rows] = await pool.execute('SELECT estado FROM citas WHERE idCita = ? LIMIT 1', [idCita]);
                if (!rows || rows.length === 0) {
                    throw this.buildAppError('La cita no existe', 404, 'APPOINTMENT_NOT_FOUND');
                }
                throw this.buildAppError('La cita no puede confirmarse', 409, 'APPOINTMENT_NOT_CONFIRMABLE');
            }

            return { idCita };
        } catch (error) {
            console.error('Error en Cita.marcarConfirmada:', error);
            if (error.status && error.code) throw error;
            throw new Error('Error al confirmar cita');
        }
    }

    static async marcarNoAsistio(data) {
        try {
            const { idCita, usuarioId } = data;

            const [result] = await pool.execute(
                `UPDATE citas
                 SET estado = 'N',
                     modificada_por = ?
                 WHERE idCita = ?
                   AND estado = 'F'`,
                [usuarioId, idCita]
            );

            if (!result || result.affectedRows === 0) {
                const [rows] = await pool.execute('SELECT estado FROM citas WHERE idCita = ? LIMIT 1', [idCita]);
                if (!rows || rows.length === 0) {
                    throw this.buildAppError('La cita no existe', 404, 'APPOINTMENT_NOT_FOUND');
                }
                throw this.buildAppError('La cita no puede marcarse como no asistió', 409, 'APPOINTMENT_NOT_NO_SHOWABLE');
            }

            return { idCita };
        } catch (error) {
            console.error('Error en Cita.marcarNoAsistio:', error);
            if (error.status && error.code) throw error;
            throw new Error('Error al marcar cita como no asistió');
        }
    }

    static async listarCitas(filters = {}) {
        try {
            let page = parseInt(filters.page, 10) || 1;
            let limit = parseInt(filters.limit, 10) || 20;
            if (page < 1) page = 1;
            if (limit < 1) limit = 20;
            if (limit > 100) limit = 100;

            const whereConditions = [];
            const params = [];

            if (filters.mascotaId) {
                whereConditions.push('c.mascotaId = ?');
                params.push(Number(filters.mascotaId));
            }

            if (filters.estado) {
                const estados = String(filters.estado)
                    .split(',')
                    .map((value) => value.trim().toUpperCase())
                    .filter(Boolean);

                if (estados.length > 0) {
                    whereConditions.push(`c.estado IN (${estados.map(() => '?').join(',')})`);
                    params.push(...estados);
                }
            }

            if (filters.fechaDesde && filters.fechaHasta) {
                whereConditions.push('c.fecha_inicio < ? AND c.fecha_fin > ?');
                params.push(filters.fechaHasta, filters.fechaDesde);
            } else if (filters.fechaDesde) {
                whereConditions.push('c.fecha_inicio >= ?');
                params.push(filters.fechaDesde);
            } else if (filters.fechaHasta) {
                whereConditions.push('c.fecha_inicio <= ?');
                params.push(filters.fechaHasta);
            }

            const whereClause = whereConditions.length > 0
                ? `WHERE ${whereConditions.join(' AND ')}`
                : '';

            const [countRows] = await pool.execute(
                `SELECT COUNT(*) as total
                 FROM citas c
                 ${whereClause}`,
                params
            );

            const total = countRows[0]?.total || 0;
            const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
            const offset = (page - 1) * limit;

            const [rows] = await pool.execute(
                `SELECT
                    c.idCita AS idCita,
                    c.mascotaId AS mascotaId,
                    m.Nombre AS mascotaNombre,
                    m.Propietario AS propietarioId,
                    CONCAT(p.Nombre, ' ', p.Apellidos) AS propietarioNombre,
                    DATE_FORMAT(c.fecha_inicio, '%Y-%m-%d %H:%i:%s') AS fechaInicio,
                    DATE_FORMAT(c.fecha_fin, '%Y-%m-%d %H:%i:%s') AS fechaFin,
                    c.estado AS estado,
                    c.motivo AS motivo,
                    c.notas AS notas,
                    c.creada_por AS creadaPor,
                    DATE_FORMAT(c.fecha_creacion, '%Y-%m-%d %H:%i:%s') AS fechaCreacion,
                    c.modificada_por AS modificadaPor,
                    DATE_FORMAT(c.fecha_actualizacion, '%Y-%m-%d %H:%i:%s') AS fechaActualizacion
                 FROM citas c
                 INNER JOIN mascota m ON m.idMascota = c.mascotaId
                 LEFT JOIN propietario p ON p.idPropietario = m.Propietario
                 ${whereClause}
                 ORDER BY c.fecha_inicio ASC
                 LIMIT ${limit} OFFSET ${offset}`,
                params
            );

            return {
                citas: rows,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCitas: total,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                    limit
                }
            };
        } catch (error) {
            console.error('Error en Cita.listarCitas:', error);
            throw new Error('Error al listar citas');
        }
    }

    static async obtenerCitaPorId(idCita) {
        try {
            const [rows] = await pool.execute(
                `SELECT
                    c.idCita AS idCita,
                    c.mascotaId AS mascotaId,
                    m.Nombre AS mascotaNombre,
                    m.Propietario AS propietarioId,
                    CONCAT(p.Nombre, ' ', p.Apellidos) AS propietarioNombre,
                    DATE_FORMAT(c.fecha_inicio, '%Y-%m-%d %H:%i:%s') AS fechaInicio,
                    DATE_FORMAT(c.fecha_fin, '%Y-%m-%d %H:%i:%s') AS fechaFin,
                    c.estado AS estado,
                    c.motivo AS motivo,
                    c.notas AS notas,
                    c.creada_por AS creadaPor,
                    DATE_FORMAT(c.fecha_creacion, '%Y-%m-%d %H:%i:%s') AS fechaCreacion,
                    c.modificada_por AS modificadaPor,
                    DATE_FORMAT(c.fecha_actualizacion, '%Y-%m-%d %H:%i:%s') AS fechaActualizacion
                 FROM citas c
                 INNER JOIN mascota m ON m.idMascota = c.mascotaId
                 LEFT JOIN propietario p ON p.idPropietario = m.Propietario
                 WHERE c.idCita = ?
                 LIMIT 1`,
                [idCita]
            );

            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en Cita.obtenerCitaPorId:', error);
            throw new Error('Error al obtener cita');
        }
    }

    static async obtenerEstadoReserva(idReserva, usuarioId) {
        try {
            const [rows] = await pool.execute(
                `SELECT
                    idReserva,
                    mascotaId,
                    usuarioId,
                    fecha_inicio AS fechaInicio,
                    fecha_fin AS fechaFin,
                    fecha_expiracion AS fechaExpiracion,
                    TIMESTAMPDIFF(SECOND, NOW(), fecha_expiracion) AS segundosRestantesBruto
                 FROM cita_reservas
                 WHERE idReserva = ?
                   AND usuarioId = ?
                 LIMIT 1`,
                [idReserva, usuarioId]
            );

            if (rows.length === 0) {
                return null;
            }

            const reserva = rows[0];
            const segundosRestantes = Math.max(Number(reserva.segundosRestantesBruto || 0), 0);
            const activa = segundosRestantes > 0;

            return {
                idReserva: reserva.idReserva,
                mascotaId: reserva.mascotaId,
                usuarioId: reserva.usuarioId,
                fechaInicio: reserva.fechaInicio,
                fechaFin: reserva.fechaFin,
                fechaExpiracion: reserva.fechaExpiracion,
                segundosRestantes,
                activa,
                debeReiniciarFlujo: !activa
            };
        } catch (error) {
            console.error('Error en Cita.obtenerEstadoReserva:', error);
            throw new Error('Error al consultar estado de reserva');
        }
    }
}

module.exports = Cita;
