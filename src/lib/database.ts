import { supabase } from "./supabase";
import type {
  Project,
  ProjectCreateInput,
  ProjectImage,
  ProjectUpdateInput,
  ProjectWithImages,
} from "../types/project";

type ServiceResult<T> = Promise<{ data: T | null; error: any }>;

async function attachImagesToProjects(
  projectList: Project[]
): ServiceResult<ProjectWithImages[]> {
  try {
    const projectsWithImages = await Promise.all(
      projectList.map(async (project) => {
        const { data: images, error } = await projectImages.getByProjectId(project.id);
        if (error) {
          throw error;
        }

        return {
          ...project,
          images: images ?? [],
        };
      })
    );

    return { data: projectsWithImages, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export const projects = {
  async getAll(): ServiceResult<Project[]> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true });

    return { data, error };
  },

  async getFeatured(): ServiceResult<Project[]> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("featured", true)
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .limit(6);

    return { data, error };
  },

  async getBySlug(slug: string): ServiceResult<Project> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single();

    return { data, error };
  },

  async getById(id: string): ServiceResult<Project> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    return { data, error };
  },

  async getAllAdmin(): ServiceResult<Project[]> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    return { data, error };
  },

  async create(project: ProjectCreateInput): ServiceResult<Project> {
    const { data, error } = await supabase
      .from("projects")
      .insert(project)
      .select()
      .single();

    return { data, error };
  },

  async update(id: string, updates: ProjectUpdateInput): ServiceResult<Project> {
    const { data, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  },

  async delete(id: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    return { error };
  },
};

export const projectImages = {
  async getByProjectId(projectId: string): ServiceResult<ProjectImage[]> {
    const { data, error } = await supabase
      .from("project_images")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });

    return { data, error };
  },

  async create(image: Omit<ProjectImage, "id" | "created_at">): ServiceResult<ProjectImage> {
    const { data, error } = await supabase
      .from("project_images")
      .insert(image)
      .select()
      .single();

    return { data, error };
  },

  async updateOrder(id: string, sortOrder: number): ServiceResult<ProjectImage> {
    const { data, error } = await supabase
      .from("project_images")
      .update({ sort_order: sortOrder })
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  },

  async reorder(projectId: string, imageIds: string[]): Promise<{ error: any }> {
    const updates = await Promise.all(
      imageIds.map(async (id, index) => {
        const { error } = await supabase
          .from("project_images")
          .update({ sort_order: index })
          .eq("project_id", projectId)
          .eq("id", id);

        return error;
      })
    );

    return { error: updates.find(Boolean) ?? null };
  },

  async delete(id: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from("project_images")
      .delete()
      .eq("id", id);

    return { error };
  },
};

export const projectService = {
  async getAll(): ServiceResult<ProjectWithImages[]> {
    const { data, error } = await projects.getAllAdmin();
    if (error || !data) {
      return { data: null, error };
    }

    return attachImagesToProjects(data);
  },

  async getProjectWithImages(slug: string): ServiceResult<ProjectWithImages> {
    const { data: project, error: projectError } = await projects.getBySlug(slug);
    if (projectError || !project) {
      return { data: null, error: projectError };
    }

    const { data: images, error: imagesError } = await projectImages.getByProjectId(project.id);
    if (imagesError) {
      return { data: null, error: imagesError };
    }

    return {
      data: {
        ...project,
        images: images ?? [],
      },
      error: null,
    };
  },

  create(project: ProjectCreateInput) {
    return projects.create(project);
  },

  update(id: string, updates: ProjectUpdateInput) {
    return projects.update(id, updates);
  },

  delete(id: string) {
    return projects.delete(id);
  },
};

export const projectImageService = projectImages;
