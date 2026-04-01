export type Project = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string | null;
  title: string;
  category: string;
  description: string;
  thumbnailUrl: string;
  heroImageUrl: string;
  isFeatured: boolean;
  externalLink?: string;
  sortOrder: number;
};

export type ProjectImage = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string | null;
  projectId: string;
  url: string;
  caption?: string;
  isProcessShot: boolean;
  sortOrder: number;
};

export type ContactSubmission = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string | null;
  name: string;
  email: string;
  subject?: string;
  message: string;
};
