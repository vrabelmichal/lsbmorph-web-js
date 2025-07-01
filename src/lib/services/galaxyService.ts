import { prisma } from '../db';
import { ClassifyParams } from '../../types';

export class GalaxyService {
  static async getNextGalaxy(userId: string, currentGalaxyId?: string, params: ClassifyParams = {}) {
    const { withRedshift, classified, skipped, validRedshift, lsbClass, morphology } = params;

    if (currentGalaxyId) {
      return this.getNextInChain(userId, currentGalaxyId, params);
    }

    const baseQuery = {
      include: {
        classifications: { where: { userId } },
        skippedGalaxies: { where: { userId } }
      }
    };

    let where: any = {};

    // Apply filters
    if (withRedshift !== undefined) {
      if (withRedshift) {
        where.AND = [
          { redshiftX: { not: null } },
          { redshiftY: { not: null } }
        ];
      } else {
        where.OR = [
          { redshiftX: null },
          { redshiftY: null }
        ];
      }
    }

    const galaxies = await prisma.galaxy.findMany({
      ...baseQuery,
      where,
      orderBy: [
        { previousId: { sort: 'asc', nulls: 'first' } },
        { id: 'asc' }
      ]
    });

    return galaxies.find(galaxy => {
      const isClassified = galaxy.classifications.length > 0;
      const isSkipped = galaxy.skippedGalaxies.length > 0;
      
      if (classified !== undefined && classified !== isClassified) return false;
      if (skipped !== undefined && skipped !== isSkipped) return false;
      
      if (lsbClass !== undefined || morphology !== undefined) {
        const classification = galaxy.classifications[0];
        if (!classification) return false;
        if (lsbClass !== undefined && classification.lsbClass !== lsbClass) return false;
        if (morphology !== undefined && classification.morphology !== morphology) return false;
      }
      
      return true;
    });
  }

  private static async getNextInChain(userId: string, currentId: string, params: ClassifyParams) {
    const visited = new Set([currentId]);
    let current = await prisma.galaxy.findUnique({
      where: { id: currentId },
      include: { next: true }
    });

    while (current?.next && !visited.has(current.next.id)) {
      current = await prisma.galaxy.findUnique({
        where: { id: current.next.id },
        include: {
          next: true,
          classifications: { where: { userId } },
          skippedGalaxies: { where: { userId } }
        }
      });

      if (!current) break;
      
      visited.add(current.id);
      
      if (this.matchesFilters(current, params)) {
        return current;
      }
    }

    return null;
  }

  private static matchesFilters(galaxy: any, params: ClassifyParams): boolean {
    const { withRedshift, classified, skipped, lsbClass, morphology, validRedshift } = params;
    
    const isClassified = galaxy.classifications.length > 0;
    const isSkipped = galaxy.skippedGalaxies.length > 0;
    const classification = galaxy.classifications[0];

    if (withRedshift !== undefined) {
      const hasRedshift = galaxy.redshiftX !== null && galaxy.redshiftY !== null;
      if (withRedshift !== hasRedshift) return false;
    }

    if (classified !== undefined && classified !== isClassified) return false;
    if (skipped !== undefined && skipped !== isSkipped) return false;

    if (lsbClass !== undefined && (!classification || classification.lsbClass !== lsbClass)) return false;
    if (morphology !== undefined && (!classification || classification.morphology !== morphology)) return false;
    if (validRedshift !== undefined && (!classification || classification.validRedshift !== validRedshift)) return false;

    return true;
  }
}
