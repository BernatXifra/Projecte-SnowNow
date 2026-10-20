import { Router, Request, Response } from 'express';
import { SkierSession } from '../models/SkierSession.js';

const router = Router();

/**
 * 1. GET /api/skier-sessions/leaderboard
 * Utilitza l'AGGREGATION FRAMEWORK de MongoDB per calcular el rànquing d'esquiadors.
 * Permet filtrar per data, estació i ordenar per velocitat màxima o distància acumulada.
 */
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const { resortId, metric = 'speed', date, limit = '10' } = req.query;

    const matchStage: Record<string, any> = {};

    if (resortId) {
      matchStage.resortId = String(resortId);
    }

    if (date) {
      const targetDate = new Date(String(date));
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      matchStage.date = { $gte: startOfDay, $lte: endOfDay };
    }

    // Determinem el camp principal d'ordenació segons la mètrica
    let sortField = 'maxSpeedKmh';
    if (metric === 'distance') sortField = 'totalDistanceMeters';
    if (metric === 'vertical') sortField = 'totalVerticalDropMeters';

    // CANONADA D'AGREGACIÓ (MongoDB Aggregation Pipeline)
    const pipeline: any[] = [
      { $match: matchStage },
      {
        $group: {
          _id: '$skierId',
          skierName: { $first: '$skierName' },
          resortName: { $last: '$resortName' },
          maxSpeedKmh: { $max: '$topSpeedKmh' },
          totalDistanceMeters: { $sum: '$totalDistanceMeters' },
          totalVerticalDropMeters: { $sum: '$verticalDropMeters' },
          sessionsCount: { $sum: 1 },
          lastSession: { $max: '$date' },
        },
      },
      {
        $sort: { [sortField]: -1 },
      },
      {
        $limit: Math.max(1, parseInt(String(limit), 10) || 10),
      },
      {
        $project: {
          _id: 0,
          skierId: '$_id',
          skierName: 1,
          resortName: 1,
          maxSpeedKmh: { $round: ['$maxSpeedKmh', 2] },
          totalDistanceKm: {
            $round: [{ $divide: ['$totalDistanceMeters', 1000] }, 2],
          },
          totalVerticalDropMeters: 1,
          sessionsCount: 1,
          lastSession: 1,
        },
      },
    ];

    const leaderboard = await SkierSession.aggregate(pipeline);

    // Afegim la posició numèrica (rank) al resultat
    const rankedLeaderboard = leaderboard.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    res.json({
      success: true,
      metric,
      resortId: resortId || 'all',
      count: rankedLeaderboard.length,
      data: rankedLeaderboard,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 2. GET /api/skier-sessions/nearby
 * Utilitza la consulta GEOESPACIAL amb operador $near sobre l'índex 2dsphere.
 * Troba esquiadors que han iniciat sessió a prop d'unes coordenades GPS.
 */
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const { lng, lat, maxDistance = '5000' } = req.query;

    if (!lng || !lat) {
      return res.status(400).json({
        success: false,
        error: 'Cal especificar la longitud (lng) i latitud (lat) numèriques.',
      });
    }

    const longitude = parseFloat(String(lng));
    const latitude = parseFloat(String(lat));
    const distanceInMeters = parseFloat(String(maxDistance));

    // Consulta Geoespacial MongoDB ($near requereix índex 2dsphere)
    const nearbySessions = await SkierSession.find({
      startLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: distanceInMeters,
        },
      },
    })
      .select('skierId skierName resortName startLocation topSpeedKmh totalDistanceMeters date')
      .limit(20);

    res.json({
      success: true,
      queryCenter: { longitude, latitude },
      maxDistanceMeters: distanceInMeters,
      found: nearbySessions.length,
      data: nearbySessions,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 3. POST /api/skier-sessions/intersects-zone
 * Utilitza l'operador geoespacial $geoIntersects sobre trajectòries LineString.
 * Determina quins esquiadors han travessat una zona (polígon GeoJSON), per exemple una pista o zona de perill.
 */
router.post('/intersects-zone', async (req: Request, res: Response) => {
  try {
    const { polygonCoordinates } = req.body;

    if (!polygonCoordinates || !Array.isArray(polygonCoordinates)) {
      return res.status(400).json({
        success: false,
        error: 'polygonCoordinates ha de ser un array de coordenades [lng, lat] tancat en bucle.',
      });
    }

    // Consulta Geoespacial $geoIntersects sobre la trajectòria LineString
    const intersectingSessions = await SkierSession.find({
      trajectory: {
        $geoIntersects: {
          $geometry: {
            type: 'Polygon',
            coordinates: [polygonCoordinates],
          },
        },
      },
    }).select('skierId skierName resortName topSpeedKmh date');

    res.json({
      success: true,
      found: intersectingSessions.length,
      data: intersectingSessions,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 4. GET /api/skier-sessions/stats/:skierId
 * Canonada d'Agregació per al resum històric i mètriques personals d'un esquiador.
 */
router.get('/stats/:skierId', async (req: Request, res: Response) => {
  try {
    const { skierId } = req.params;

    const statsPipeline = [
      { $match: { skierId } },
      {
        $group: {
          _id: '$skierId',
          skierName: { $first: '$skierName' },
          totalSessions: { $sum: 1 },
          overallMaxSpeedKmh: { $max: '$topSpeedKmh' },
          totalDistanceMeters: { $sum: '$totalDistanceMeters' },
          totalVerticalDropMeters: { $sum: '$verticalDropMeters' },
          totalDurationSeconds: { $sum: '$durationSeconds' },
          resortsVisited: { $addToSet: '$resortName' },
        },
      },
      {
        $project: {
          _id: 0,
          skierId: '$_id',
          skierName: 1,
          totalSessions: 1,
          overallMaxSpeedKmh: { $round: ['$overallMaxSpeedKmh', 2] },
          totalDistanceKm: {
            $round: [{ $divide: ['$totalDistanceMeters', 1000] }, 2],
          },
          totalVerticalDropMeters: 1,
          totalHours: {
            $round: [{ $divide: ['$totalDurationSeconds', 3600] }, 2],
          },
          resortsVisited: 1,
        },
      },
    ];

    const result = await SkierSession.aggregate(statsPipeline);

    if (result.length === 0) {
      return res.status(404).json({ success: false, error: 'Esquiador no trobat' });
    }

    res.json({ success: true, data: result[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 5. POST /api/skier-sessions
 * Registra una nova sessió amb telemetria i trajectòria GeoJSON.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const sessionData = req.body;

    // Si no s'especifica startLocation però hi ha trajectory, l'obtenim del primer punt
    if (
      (!sessionData.startLocation || !sessionData.startLocation.coordinates) &&
      sessionData.trajectory &&
      sessionData.trajectory.coordinates &&
      sessionData.trajectory.coordinates.length > 0
    ) {
      sessionData.startLocation = {
        type: 'Point',
        coordinates: sessionData.trajectory.coordinates[0],
      };
    }

    const session = new SkierSession(sessionData);
    await session.save();

    res.status(201).json({
      success: true,
      message: 'Sessió enregistrada correctament',
      sessionId: session._id,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * 6. GET /api/skier-sessions/:id
 * Retorna el detall complet d'una sessió, incloent la geometria per pintar al mapa.
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const session = await SkierSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Sessió no trobada' });
    }
    res.json({ success: true, data: session });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 7. GET /api/skier-sessions
 * Llista les darreres sessions enregistrades.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(String(req.query.limit || '15'), 10);
    const sessions = await SkierSession.find()
      .select('-trackPoints') // Ometem el detall de telemetria massiva al llistat general
      .sort({ date: -1 })
      .limit(limit);

    res.json({ success: true, count: sessions.length, data: sessions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
