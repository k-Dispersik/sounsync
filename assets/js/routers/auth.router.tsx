import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import { AUTH_ROUTES } from "./routes.names";

export default [
    {
        path: AUTH_ROUTES.LOGIN,
        element: <LoginPage />,
    },
    {
        path: AUTH_ROUTES.REGISTER,
        element: <RegisterPage />,
    },
];
