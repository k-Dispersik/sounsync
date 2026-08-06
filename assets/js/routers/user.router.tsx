import Workspace from "@/pages/user/workspace";
import { USER_ROUTES } from "./routes.names";

export default [
    {
        path: USER_ROUTES.PROJECT,
        element: <Workspace />,
    },
];
