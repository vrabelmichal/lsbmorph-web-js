import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

interface ImageOptions {
  vmaxPercentile?: number;
  vmaxPercentileRaw?: number;
  colormap?: string;
}

export class ImageService {
  private static readonly OUTPUT_DPI = 100;
  private static readonly Y_AXIS_RATIO = 0.9;
  private static readonly VMAX_PERCENTILES = [99.0, 99.5, 99.9, 99.95, 80.0, 90.0];
  private static readonly VMAX_RAW_PERCENTILES = [99.7, 99.7, 99.9, 99.95, 90.0, 99.0];

  static async getGalaxyImages(galaxyId: string, options: ImageOptions = {}) {
    const { vmaxPercentile = 99.0, vmaxPercentileRaw = 99.7 } = options;
    
    const baseNames = [
      'masked_r_band',
      'galfit_model', 
      'residual',
      'raw_r_band',
      'aplpy',
      'lupton'
    ];

    const imagePaths = await Promise.all(
      baseNames.map(async (baseName) => {
        const filename = this.getImageFilename(baseName, vmaxPercentile, vmaxPercentileRaw);
        const imagePath = path.join(process.env.GALAXY_IMAGES_FOLDER!, galaxyId, filename);
        
        // Check if image exists, generate if not
        if (!(await this.fileExists(imagePath))) {
          await this.generateGalaxyImage(galaxyId, baseName, vmaxPercentile, vmaxPercentileRaw);
        }

        return {
          path: `/api/images/galaxy/${galaxyId}/${filename}`,
          title: this.getImageTitle(baseName),
          baseName,
          success: await this.fileExists(imagePath),
          vmax: this.getExpectedVmax(baseName, vmaxPercentile, vmaxPercentileRaw)
        };
      })
    );

    return imagePaths;
  }

  private static getImageFilename(baseName: string, vmax: number, vmaxRaw: number): string {
    const slugify = (value: number) => 
      value.toFixed(Math.abs(value % 1) < 0.05 ? 1 : 2)
        .replace(/-/g, 'm')
        .replace(/\./g, 'p');

    if (['masked_r_band', 'galfit_model', 'residual'].includes(baseName)) {
      return `${baseName}_vmax${slugify(vmax)}.png`;
    }
    if (baseName === 'raw_r_band') {
      return `${baseName}_vmax${slugify(vmaxRaw)}.png`;
    }
    return `${baseName}.png`;
  }

  private static getImageTitle(baseName: string): string {
    const titles = {
      'masked_r_band': 'Masked r-Band',
      'galfit_model': 'GalfitModel', 
      'residual': 'Residual',
      'raw_r_band': 'Raw r-band',
      'aplpy': 'APLpy',
      'lupton': 'Zoomed out'
    };
    return titles[baseName as keyof typeof titles] || baseName;
  }

  private static async generateGalaxyImage(
    galaxyId: string, 
    baseName: string, 
    vmaxPercentile: number,
    vmaxPercentileRaw: number
  ) {
    // Implementation depends on your FITS processing needs
    // This is a simplified version - you'd need to integrate FITS reading library
    
    const outputDir = path.join(process.env.GALAXY_IMAGES_FOLDER!, galaxyId);
    await fs.mkdir(outputDir, { recursive: true });

    if (['aplpy', 'lupton'].includes(baseName)) {
      // Copy pre-generated color images
      await this.copyColorImage(galaxyId, baseName, outputDir);
    } else {
      // Generate from FITS data
      await this.generateFromFits(galaxyId, baseName, vmaxPercentile, vmaxPercentileRaw, outputDir);
    }
  }

  private static async copyColorImage(galaxyId: string, baseName: string, outputDir: string) {
    const sourceDir = baseName === 'aplpy' ? 'color_images/aplpy' : 'color_images/Lupton_RGB_Images';
    const sourcePath = path.join(process.env.DATA_BASE_DIR!, sourceDir, `${galaxyId}.png`);
    const destPath = path.join(outputDir, `${baseName}.png`);

    try {
      if (await this.fileExists(sourcePath)) {
        if (baseName === 'aplpy') {
          // Flip image vertically for APLpy
          await sharp(sourcePath)
            .flip()
            .png()
            .toFile(destPath);
        } else {
          await sharp(sourcePath).toFile(destPath);
        }
      } else {
        await this.generatePlaceholderImage(destPath, `${baseName} image not available`);
      }
    } catch (error) {
      await this.generatePlaceholderImage(destPath, `Error loading ${baseName} image`);
    }
  }

  private static async generatePlaceholderImage(outputPath: string, text: string) {
    // Generate a simple placeholder image with text
    const width = 600;
    const height = Math.floor(width * this.Y_AXIS_RATIO);
    
    await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 240, g: 240, b: 240 }
      }
    })
    .png()
    .toFile(outputPath);
  }

  private static async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  static getContrastOptions() {
    return {
      vmaxPercentiles: this.VMAX_PERCENTILES,
      vmaxRawPercentiles: this.VMAX_RAW_PERCENTILES
    };
  }

  private static getExpectedVmax(baseName: string, vmax: number, vmaxRaw: number): number | null {
    if (['masked_r_band', 'galfit_model', 'residual'].includes(baseName)) {
      return vmax;
    }
    if (baseName === 'raw_r_band') {
      return vmaxRaw;
    }
    return null;
  }
}
