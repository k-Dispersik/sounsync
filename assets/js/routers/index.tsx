import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "../AppRoot";
import commonRouter from "./common.router";
import userRouter from "./user.router";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [...commonRouter, ...userRouter],
        errorElement: <div>Not Found</div>,
    },
]);

const AppRouter = () => <RouterProvider router={router} />;

export default AppRouter;
