import request from "./request";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  visibility: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export const getProjects = () => request.get<Project[]>("/projects");

export const createProject = (data: {
  name: string;
  description?: string;
  visibility?: string;
}) => request.post<Project>("/projects", data);

export const updateProject = (id: string, data: { name?: string; description?: string }) =>
  request.patch<Project>(`/projects/${id}`, data);

export const deleteProject = (id: string) => request.delete<null>(`/projects/${id}`);
