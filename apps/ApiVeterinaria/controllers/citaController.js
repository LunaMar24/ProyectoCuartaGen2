/**
 * Controlador de Citas
 * @description Maneja reserva temporal y confirmación de cita
 */

const { validationResult } = require('express-validator');
const Cita = require('../models/Cita');

class CitaController {
    static async getCitas(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const { fechaDesde, fechaHasta, estado, mascotaId, page, limit } = req.query;

            const result = await Cita.listarCitas({
                fechaDesde,
                fechaHasta,
                estado,
                mascotaId,
                page,
                limit
            });

            return res.status(200).json({
                success: true,
                message: 'Citas obtenidas correctamente',
                data: result.citas,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Error en getCitas:', error);
            return res.status(error.status || 500).json({
                success: false,
                message: error.message || 'Error interno del servidor',
                code: error.code || 'INTERNAL_ERROR'
            });
        }
    }

    static async getCitaById(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const idCita = Number(req.params.id);
            const cita = await Cita.obtenerCitaPorId(idCita);

            if (!cita) {
                return res.status(404).json({
                    success: false,
                    message: 'Cita no encontrada',
                    code: 'APPOINTMENT_NOT_FOUND'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Cita obtenida correctamente',
                data: cita
            });
        } catch (error) {
            console.error('Error en getCitaById:', error);
            return res.status(error.status || 500).json({
                success: false,
                message: error.message || 'Error interno del servidor',
                code: error.code || 'INTERNAL_ERROR'
            });
        }
    }

    static async getEstadoReserva(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const idReserva = Number(req.params.idReserva);
            const usuarioId = req.user.userId;

            const estadoReserva = await Cita.obtenerEstadoReserva(idReserva, usuarioId);
            if (!estadoReserva) {
                return res.status(404).json({
                    success: false,
                    message: 'Reserva no encontrada',
                    code: 'RESERVATION_NOT_FOUND'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Estado de reserva obtenido correctamente',
                data: estadoReserva
            });
        } catch (error) {
            console.error('Error en getEstadoReserva:', error);
            return res.status(error.status || 500).json({
                success: false,
                message: error.message || 'Error interno del servidor',
                code: error.code || 'INTERNAL_ERROR'
            });
        }
    }

    static async reservarCita(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const { mascotaId, fechaInicio, fechaFin, timeoutMinutos } = req.body;
            const usuarioId = req.user.userId;

            const result = await Cita.reservarTemporal({
                usuarioId,
                mascotaId,
                fechaInicio,
                fechaFin,
                timeoutMinutos
            });

            const estadoReserva = await Cita.obtenerEstadoReserva(result.idReserva, usuarioId);

            return res.status(201).json({
                success: true,
                message: 'Reserva temporal creada correctamente',
                idReserva: result.idReserva,
                reserva: estadoReserva
            });
        } catch (error) {
            console.error('Error en reservarCita:', error);
            return res.status(error.status || 500).json({
                success: false,
                message: error.message || 'Error interno del servidor',
                code: error.code || 'INTERNAL_ERROR'
            });
        }
    }

    static async confirmarCita(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const { idReserva, motivo, notas } = req.body;
            const usuarioId = req.user.userId;

            const result = await Cita.confirmarReserva({
                idReserva,
                usuarioId,
                motivo,
                notas
            });

            return res.status(201).json({
                success: true,
                message: 'Cita creada correctamente',
                idCita: result.idCita
            });
        } catch (error) {
            console.error('Error en confirmarCita:', error);
            return res.status(error.status || 500).json({
                success: false,
                message: error.message || 'Error interno del servidor',
                code: error.code || 'INTERNAL_ERROR'
            });
        }
    }

    static async cancelarCita(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Errores de validación',
                    errors: errors.array()
                });
            }

            const idCita = Number(req.params.id);
            const usuarioId = req.user.userId;

            await Cita.cancelarCita({ idCita, usuarioId });

            return res.status(200).json({
                success: true,
                message: 'Cita cancelada correctamente',
                idCita
            });
        } catch (error) {
            console.error('Error en cancelarCita:', error);
            return res.status(error.status || 500).json({
                success: false,
                message: error.message || 'Error interno del servidor',
                code: error.code || 'INTERNAL_ERROR'
            });
        }
    }
}

module.exports = CitaController;
