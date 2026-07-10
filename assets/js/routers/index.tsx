import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "../AppRoot";
import RequireAuth from "../shared/auth/RequireAuth";
import authRouter from "./auth.router";
import commonRouter from "./common.router";
import userRouter from "./user.router";

const router = createBrowserRouter([
    ...authRouter,
    {
        path: "/",
        element: (
            <RequireAuth>
                <App />
            </RequireAuth>
        ),
        children: [...commonRouter, ...userRouter],
        errorElement: <div>Not Found</div>,
    },
]);

const AppRouter = () => <RouterProvider router={router} />;

export default AppRouter;
