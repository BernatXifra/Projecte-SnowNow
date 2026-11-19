import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { RentalItem, rentalMeasurements } from '../models/RentalItem.js';
import type { RentalCategory, RentalReservation } from '../models/RentalItem.js';

const router = Router();
const catalogueFields = 'resortId name category fit attributes';
const reservationIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isCategory(value: unknown): value is RentalCategory {
  return typeof value === 'string' && Object.hasOwn(rentalMeasurements, value);
}

function isMeasurement(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isReservationId(value: unknown): value is string {
  return typeof value === 'string' && value.length === 36 && reservationIdPattern.test(value);
}

function parseDay(value: unknown): Date | undefined {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
  const date = new Date(value);
  if (Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value) return date;
}

function reservationData(
  item: { _id: unknown; resortId: string; category: RentalCategory },
  reservation: RentalReservation,
) {
  return {
    itemId: item._id,
    resortId: item.resortId,
    category: item.category,
    reservation,
  };
}

function findReservation(id: string) {
  return RentalItem.findOne({ 'reservations._id': id }, {
    resortId: 1,
    category: 1,
    reservations: { $elemMatch: { _id: id } },
  }).lean();
}

router.get('/inventory', async (req, res) => {
  const { resortId, category, page = '1', limit = '20' } = req.query;
  const pageNumber = typeof page === 'string' ? Number(page) : NaN;
  const pageSize = typeof limit === 'string' ? Number(limit) : NaN;
  const offset = (pageNumber - 1) * pageSize;

  if (
    (resortId !== undefined && !isText(resortId)) ||
    (category !== undefined && !isCategory(category)) ||
    !Number.isSafeInteger(pageNumber) || pageNumber < 1 ||
    !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100 ||
    !Number.isSafeInteger(offset)
  ) {
    return res.status(400).json({ success: false, error: 'Revisa els filtres i la paginació.' });
  }

  const filter = {
    ...(resortId !== undefined && { resortId: resortId.trim() }),
    ...(category !== undefined && { category }),
  };

  const items = await RentalItem.find(filter)
    .select(catalogueFields)
    .sort({ _id: 1 })
    .skip(offset)
    .limit(pageSize)
    .lean();

  res.json({ success: true, page: pageNumber, limit: pageSize, count: items.length, data: items });
});

router.post('/inventory', async (req, res) => {
  const body: unknown = req.body;
  if (!isObject(body)) {
    return res.status(400).json({ success: false, error: 'Cal enviar les dades del material.' });
  }

  const { resortId, name, category, fit, attributes = {} } = body;
  if (
    !isText(resortId) || !isText(name) || !isCategory(category) ||
    !isObject(fit) || !isMeasurement(fit.min) || !isMeasurement(fit.max) || fit.min > fit.max ||
    !isObject(attributes)
  ) {
    return res.status(400).json({
      success: false,
      error: 'Cal indicar resortId, name, category, un rang fit vàlid i attributes com a objecte.',
    });
  }

  const item = await RentalItem.create({
    resortId, name, category, fit: { min: fit.min, max: fit.max }, attributes,
  });
  res.status(201).json({
    success: true,
    data: {
      _id: item._id, resortId: item.resortId, name: item.name,
      category: item.category, fit: item.fit, attributes: item.attributes,
    },
  });
});

router.post('/reservations', async (req, res) => {
  const body: unknown = req.body;
  if (!isObject(body)) {
    return res.status(400).json({ success: false, error: 'Cal enviar les dades de la reserva.' });
  }

  const { resortId, skierId, category, measurements, reservationId = randomUUID() } = body;
  const startDate = parseDay(body.startDate);
  const endDate = parseDay(body.endDate);
  if (
    !isText(resortId) || !isText(skierId) || !isCategory(category) ||
    !isReservationId(reservationId) ||
    !startDate || !endDate || startDate >= endDate
  ) {
    return res.status(400).json({
      success: false,
      error: 'Cal indicar resortId, skierId, category i dates vàlides (AAAA-MM-DD). Si s’envia reservationId, ha de ser un UUID v4 en minúscules.',
    });
  }

  const measurementField = rentalMeasurements[category];
  const measurement = isObject(measurements) ? measurements[measurementField] : undefined;
  if (!isMeasurement(measurement)) {
    return res.status(400).json({ success: false, error: `Cal indicar measurements.${measurementField} amb un valor positiu.` });
  }

  const reservation: RentalReservation = {
    _id: reservationId,
    skierId: skierId.trim(),
    measurement,
    startDate,
    endDate,
    status: 'confirmed',
    createdAt: new Date(),
  };

  const sendExisting = (item: NonNullable<Awaited<ReturnType<typeof findReservation>>>) => {
    const existing = item.reservations[0];
    if (
      item.resortId !== resortId.trim() || item.category !== category ||
      existing.skierId !== reservation.skierId || existing.measurement !== measurement ||
      existing.startDate.getTime() !== startDate.getTime() ||
      existing.endDate.getTime() !== endDate.getTime()
    ) {
      return res.status(409).json({ success: false, error: 'Aquest identificador ja correspon a una altra reserva.' });
    }

    return res.json({ success: true, data: reservationData(item, existing) });
  };

  await RentalItem.init();
  const existing = await findReservation(reservationId);
  if (existing) return sendExisting(existing);

  if (startDate.toISOString().slice(0, 10) < new Date().toISOString().slice(0, 10)) {
    return res.status(400).json({ success: false, error: 'La data d’inici no pot ser anterior al dia actual (UTC).' });
  }

  try {
    // Comprovem la talla i el solapament dins la mateixa operació que crea la reserva.
    // La data de retorn és exclusiva, de manera que una altra reserva pot començar aquell dia.
    const item = await RentalItem.findOneAndUpdate({
      resortId: resortId.trim(),
      category,
      'fit.min': { $lte: measurement },
      'fit.max': { $gte: measurement },
      'reservations._id': { $ne: reservationId },
      reservations: {
        $not: {
          $elemMatch: { status: 'confirmed', startDate: { $lt: endDate }, endDate: { $gt: startDate } },
        },
      },
    }, {
      $push: { reservations: reservation },
    }, {
      sort: { _id: 1 },
      projection: { resortId: 1, category: 1 },
      runValidators: true,
    }).lean();

    if (item) return res.status(201).json({ success: true, data: reservationData(item, reservation) });
  } catch (error) {
    // Dues peticions amb el mateix identificador poden arribar a unitats diferents.
    if (!isObject(error) || error.code !== 11000) throw error;
  }

  const concurrentReservation = await findReservation(reservationId);
  if (concurrentReservation) return sendExisting(concurrentReservation);

  res.status(409).json({ success: false, error: 'No hi ha material compatible disponible per a aquestes dates.' });
});

router.delete('/reservations/:id', async (req, res) => {
  const { id } = req.params;
  if (!isReservationId(id)) {
    return res.status(400).json({ success: false, error: 'L’identificador ha de ser un UUID v4 en minúscules.' });
  }

  const item = await RentalItem.findOneAndUpdate(
    { 'reservations._id': id },
    { $set: { 'reservations.$.status': 'cancelled' } },
    {
      returnDocument: 'after',
      projection: { resortId: 1, category: 1, reservations: { $elemMatch: { _id: id } } },
      runValidators: true,
    },
  ).lean();

  if (!item) return res.status(404).json({ success: false, error: 'Reserva no trobada.' });
  res.json({ success: true, data: reservationData(item, item.reservations[0]) });
});

router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error al mòdul de lloguer:', error);
  res.status(500).json({ success: false, error: 'Error gestionant el lloguer.' });
});

export default router;
