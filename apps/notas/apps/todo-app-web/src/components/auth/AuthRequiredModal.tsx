/**
 * AuthRequiredModal Component
 *
 * A modal that appears when anonymous users try to use authenticated features.
 * Shows a clear message about what feature requires login and a sign-in button.
 */

import { X, Lock, Mic, Users, Calendar, Cloud } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export type AuthRequiredFeature = 'voice' | 'teams' | 'calendar' | 'sync' | 'general';

interface FeatureInfo {
    title: string;
    description: string;
    icon: React.ReactNode;
    benefits: string[];
}

const FEATURE_INFO: Record<AuthRequiredFeature, FeatureInfo> = {
    voice: {
        title: 'Voice Input',
        description: 'Create todos using your voice with natural language processing',
        icon: <Mic className="h-6 w-6" />,
        benefits: [
            'Create todos by speaking naturally',
            'Add due dates, priorities, and descriptions hands-free',
            'Works on any device with a microphone',
        ],
    },
    teams: {
        title: 'Team Collaboration',
        description: 'Share workspaces and collaborate with your team',
        icon: <Users className="h-6 w-6" />,
        benefits: [
            'Create team workspaces',
            'Assign todos to team members',
            'Real-time collaboration and sync',
        ],
    },
    calendar: {
        title: 'Calendar Integration',
        description: 'Sync your todos with Google Calendar and other calendars',
        icon: <Calendar className="h-6 w-6" />,
        benefits: [
            'Two-way sync with Google Calendar',
            'View todos alongside your events',
            'Get reminders across all your devices',
        ],
    },
    sync: {
        title: 'Cloud Sync',
        description: 'Sync your todos across all your devices',
        icon: <Cloud className="h-6 w-6" />,
        benefits: [
            'Access your todos anywhere',
            'Automatic backup and sync',
            'Work offline with seamless sync',
        ],
    },
    general: {
        title: 'Sign In Required',
        description: 'This feature requires an account to use',
        icon: <Lock className="h-6 w-6" />,
        benefits: [
            'Access all features',
            'Sync across devices',
            'Never lose your data',
        ],
    },
};

interface AuthRequiredModalProps {
    feature: AuthRequiredFeature;
    onClose: () => void;
}

export function AuthRequiredModal({ feature, onClose }: AuthRequiredModalProps) {
    const { login } = useAuth();
    const info = FEATURE_INFO[feature];

    const handleSignIn = () => {
        // Close modal before redirecting
        onClose();
        // Small delay to allow modal to close
        setTimeout(() => {
            login();
        }, 100);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Close"
                >
                    <X className="h-5 w-5 text-gray-500" />
                </button>

                {/* Header */}
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        {info.icon}
                        <h2 className="text-xl font-bold">{info.title}</h2>
                    </div>
                    <p className="text-blue-100 text-sm">{info.description}</p>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Sign in to unlock:
                        </h3>
                        <ul className="space-y-2">
                            {info.benefits.map((benefit, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <svg className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {benefit}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Maybe Later
                        </button>
                        <button
                            onClick={handleSignIn}
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25"
                        >
                            Sign In
                        </button>
                    </div>

                    <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
                        Free account • No credit card required
                    </p>
                </div>
            </div>
        </div>
    );
}
