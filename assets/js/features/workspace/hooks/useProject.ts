import { useState, useEffect } from "react";
import { getProject, type Project } from "../api/getProject";

export function useProject(id: number) {
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getProject(id).then((project) => {
            setProject(project);
            setIsLoading(false);
        });
    }, [id]);

    return { project, isLoading };
}
