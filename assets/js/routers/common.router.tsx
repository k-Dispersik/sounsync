import { Navigate } from "react-router-dom";

import { COMMON_ROUTES, USER_ROUTES } from "./routes.names";

export default [
    {
        // Signing in lands here, and the list is the only place to go from it.
        path: COMMON_ROUTES.HOME,
        element: <Navigate to={USER_ROUTES.PROJECTS} replace />,
    },
];
