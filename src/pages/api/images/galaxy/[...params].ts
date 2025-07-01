import { NextApiRequest, NextApiResponse } from 'next';
import { ImageService } from '../../../../lib/services/imageService';
import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { params } = req.query;
  const [galaxyId, filename] = params as string[];

  if (!galaxyId || !filename) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const imagePath = path.join(process.env.GALAXY_IMAGES_FOLDER!, galaxyId, filename);
    
    // Check if image exists
    try {
      await fs.access(imagePath);
    } catch {
      // Image doesn't exist, try to generate it
      const { vmaxPercentile, vmaxPercentileRaw } = parseImageFilename(filename);
      await ImageService.getGalaxyImages(galaxyId, { vmaxPercentile, vmaxPercentileRaw });
    }

    // Serve the image
    const imageBuffer = await fs.readFile(imagePath);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.send(imageBuffer);
    
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(404).json({ error: 'Image not found' });
  }
}

function parseImageFilename(filename: string) {
  // Parse filename to extract vmax percentiles
  const match = filename.match(/vmax([0-9pm]+)/);
  if (match) {
    const vmaxStr = match[1].replace('p', '.').replace('m', '-');
    const vmax = parseFloat(vmaxStr);
    
    // Determine if this is raw or regular image
    if (filename.includes('raw_r_band')) {
      return { vmaxPercentile: 99.0, vmaxPercentileRaw: vmax };
    } else {
      return { vmaxPercentile: vmax, vmaxPercentileRaw: 99.7 };
    }
  }
  
  return { vmaxPercentile: 99.0, vmaxPercentileRaw: 99.7 };
}
