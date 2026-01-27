import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
    const { login, isLoading } = useAuth();

    useEffect(() => {
        // Auto-trigger login if not authenticated
        if (!isLoading) {
            login().catch((error) => {
                console.error('Auto-login failed:', error);
            });
        }
    }, [isLoading, login]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900">FatorH <b>People</b></h2>
                    <p className="mt-2 text-sm text-gray-600">Redirecionando para login...</p>
                </div>
                <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        </div>
    );
}

