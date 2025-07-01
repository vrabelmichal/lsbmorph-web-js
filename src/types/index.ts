// src/types/index.ts
export interface Galaxy {
  id: string;
  ra: number;
  dec: number;
  x?: number;
  y?: number;
  redshiftX?: number;
  redshiftY?: number;
  rR?: number;
  q?: number;
  pa?: number;
  nucleus?: boolean;
  previousId?: string;
  nextId?: string;
}

export interface Classification {
  id: string;
  userId: string;
  galaxyId: string;
  lsbClass: number;
  morphology: number;
  comments?: string;
  awesomeFlag: boolean;
  validRedshift: boolean;
  dateClassified: Date;
}

export interface ClassifyParams {
  withRedshift?: boolean;
  classified?: boolean;
  skipped?: boolean;
  validRedshift?: boolean;
  lsbClass?: number;
  morphology?: number;
}

export interface GalaxyImage {
  path: string;
  title: string;
  baseName: string;
  success: boolean;
  vmax?: number;
}