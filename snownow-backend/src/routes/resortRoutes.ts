import { PipelineStage } from 'mongoose';
import { Request, Response, Router } from 'express';
import { Resort } from '../models/Resort.js';

const router = Router();

interface ResortSearchResult {
  metadata: { total: number }[];
  data: {
    _id: string;
    name: string;
    country: string;
    region: string;
    description: string;
    skiAreaKm: number;
    altitudeMeters: { base: number; summit: number };
    services: string[];
    score?: number;
  }[];
}

router.get('/search', async (req: Request, res: Response) => {
  const { q, country, region, service, minSkiAreaKm, maxSkiAreaKm, page, limit } = req.query;
  const stringParams = [q, country, region, service, minSkiAreaKm, maxSkiAreaKm, page, limit];

  if (stringParams.some((value) => value !== undefined && typeof value !== 'string')) {
    return res.status(400).json({
      success: false,
      error: 'Cada paràmetre de cerca ha de tenir un únic valor de text.',
    });
  }

  const searchText = typeof q === 'string' ? q.trim() : '';
  const countryFilter = typeof country === 'string' ? country.trim() : '';
  const regionFilter = typeof region === 'string' ? region.trim() : '';
  const serviceFilter = typeof service === 'string' ? service.trim() : '';
  const minArea = typeof minSkiAreaKm === 'string' ? Number(minSkiAreaKm) : undefined;
  const maxArea = typeof maxSkiAreaKm === 'string' ? Number(maxSkiAreaKm) : undefined;
  const pageNumber = typeof page === 'string' ? Number(page) : 1;
  const pageSize = typeof limit === 'string' ? Number(limit) : 10;

  if (
    (typeof minSkiAreaKm === 'string' && minSkiAreaKm.trim() === '') ||
    (typeof maxSkiAreaKm === 'string' && maxSkiAreaKm.trim() === '') ||
    (minArea !== undefined && (!Number.isFinite(minArea) || minArea < 0)) ||
    (maxArea !== undefined && (!Number.isFinite(maxArea) || maxArea < 0)) ||
    (minArea !== undefined && maxArea !== undefined && minArea > maxArea) ||
    !Number.isInteger(pageNumber) ||
    pageNumber < 1 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  ) {
    return res.status(400).json({
      success: false,
      error: 'Revisa el rang de superfície, la pàgina i el límit (1–100).',
    });
  }

  const match: Record<string, unknown> = {};

  if (searchText) match.$text = { $search: searchText };
  if (countryFilter) match.country = countryFilter;
  if (regionFilter) match.region = regionFilter;
  if (serviceFilter) match.services = serviceFilter;

  if (minArea !== undefined || maxArea !== undefined) {
    const areaRange: Record<string, number> = {};
    if (minArea !== undefined) areaRange.$gte = minArea;
    if (maxArea !== undefined) areaRange.$lte = maxArea;
    match.skiAreaKm = areaRange;
  }

  const projection = {
    _id: 1,
    name: 1,
    country: 1,
    region: 1,
    description: 1,
    skiAreaKm: 1,
    altitudeMeters: 1,
    services: 1,
    ...(searchText ? { score: { $meta: 'textScore' } } : {}),
  };

  const pipeline: PipelineStage[] = [
    { $match: match },
    {
      $sort: searchText
        ? { score: { $meta: 'textScore' }, name: 1 }
        : { name: 1 },
    },
    {
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $skip: (pageNumber - 1) * pageSize },
          { $limit: pageSize },
          { $project: projection },
        ],
      },
    },
  ];

  try {
    const [result] = await Resort.aggregate<ResortSearchResult>(pipeline);
    const total = result?.metadata[0]?.total ?? 0;

    res.json({
      success: true,
      page: pageNumber,
      limit: pageSize,
      total,
      pages: Math.ceil(total / pageSize),
      data: result?.data ?? [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error cercant estacions.',
    });
  }
});

export default router;
