import { useState, useEffect, useCallback } from "react";
import { getProject } from "../api/projects";
import type { Project } from "../../../shared/types/index";

export function useProject(id: number) {
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetch = useCallback(() => {
        setIsLoading(true);
        getProject(id).then((project) => {
            setProject(project);
            setIsLoading(false);
        });
    }, [id]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { project, isLoading, refetch: fetch };
}
