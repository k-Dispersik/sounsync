import ProjectsPage from "@/pages/user/projects";
import Workspace from "@/pages/user/workspace";
import { USER_ROUTES } from "./routes.names";

export default [
    {
        path: USER_ROUTES.PROJECTS,
        element: <ProjectsPage />,
    },
    {
        path: USER_ROUTES.PROJECT,
        element: <Workspace />,
    },
];
