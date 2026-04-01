export type Project = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  thumbnail_url: string | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
  created_at: string;
};

export type ProjectImage = {
  id: string;
  project_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
};

export type ProjectWithImages = Project & {
  images: ProjectImage[];
};

export type ProjectCreateInput = Omit<Project, "id" | "created_at">;
export type ProjectUpdateInput = Partial<ProjectCreateInput>;
