import { useState, useEffect } from "react";
import { getProject, type Project } from "../api/getProject";

export function useProject(id: number) {
    const [project, setProject] = useState<Project | null>(null);

    useEffect(() => {
        getProject(id).then((project) => {
            console.log(project);
            setProject(project);
        });
    }, [id]);

    return project;
}
