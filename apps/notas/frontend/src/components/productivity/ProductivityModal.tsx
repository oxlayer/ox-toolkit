
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import { cn } from '@/lib/utils';
import { useOfflineTodos } from '@/hooks/use-offline-data';
import { useAuth } from '@/lib/auth';
import { isToday, isThisWeek, subDays, format, differenceInCalendarDays } from 'date-fns';
import { Target, Trophy, Flame } from 'lucide-react';

interface ProductivityModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type Tab = 'daily' | 'weekly' | 'karma';

export function ProductivityModal({ open, onOpenChange }: ProductivityModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('daily');
    const { todos = [] } = useOfflineTodos();
    const { actor } = useAuth();

    // Stats Calculation
    // In a real app, these goals would be stored in user settings (backend).
    const dailyGoal = 5;
    const weeklyGoal = 25;
    const currentKarma = 1234; // Mocked for now
    const karmaLevel = "Enlightened";

    const completedTasks = Array.isArray(todos) ? todos.filter(t => t.completed) : [];
    const totalCompleted = completedTasks.length;

    const completedToday = completedTasks.filter(t =>
        t.completedAt ? isToday(new Date(t.completedAt)) : false
    ).length;

    const completedThisWeek = completedTasks.filter(t =>
        t.completedAt ? isThisWeek(new Date(t.completedAt), { weekStartsOn: 1 }) : false
    ).length;

    // Streak Calculation (Mocked logic for simplicity, real logic would need history)
    const dailyStreak = 2; // Mock
    const longestStreak = 104; // Mock

    // Data for "Last 7 days" chart
    const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
        const date = subDays(new Date(), 6 - i);
        const count = completedTasks.filter(t =>
            t.completedAt ? differenceInCalendarDays(date, new Date(t.completedAt)) === 0 : false
        ).length;
        return {
            day: format(date, 'EEE'),
            fullDate: format(date, 'MMM d'),
            count,
            isToday: isToday(date)
        };
    });

    // Data for "Last 4 weeks" chart (Mocked simply as we might not have enough data)
    const last4WeeksData = [
        { label: '4 weeks ago', count: 15, goal: weeklyGoal },
        { label: '3 weeks ago', count: 20, goal: weeklyGoal },
        { label: 'Last week', count: 28, goal: weeklyGoal },
        { label: 'This week', count: completedThisWeek, goal: weeklyGoal },
    ];

    const userName = actor && 'name' in actor ? actor.name : 'User';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-0 overflow-hidden sm:rounded-xl">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold">Your Productivity</DialogTitle>
                    <p className="text-sm text-red-500 cursor-pointer hover:underline">
                        View all {totalCompleted} completed tasks
                    </p>
                </DialogHeader>

                {/* Tabs */}
                <div className="flex items-center justify-center p-2 bg-gray-50/50 mx-6 rounded-lg mb-4">
                    {(['daily', 'weekly', 'karma'] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex-1 py-1.5 text-sm font-medium rounded-md transition-all capitalize",
                                activeTab === tab
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-900"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="px-6 pb-6 h-[400px] overflow-y-auto custom-scrollbar">
                    {activeTab === 'daily' && (
                        <div className="space-y-6 text-center animate-in fade-in zoom-in duration-300">
                            <div className="scale-110 py-4">
                                <div className="relative inline-flex items-center justify-center">
                                    {/* Circular Progress Mock */}
                                    <svg className="w-24 h-24 transform -rotate-90">
                                        <circle
                                            className="text-gray-200"
                                            strokeWidth="8"
                                            stroke="currentColor"
                                            fill="transparent"
                                            r="40"
                                            cx="48"
                                            cy="48"
                                        />
                                        <circle
                                            className="text-red-500 transition-all duration-1000 ease-out"
                                            strokeWidth="8"
                                            strokeDasharray={251.2}
                                            strokeDashoffset={251.2 - (251.2 * Math.min(completedToday / dailyGoal, 1))}
                                            strokeLinecap="round"
                                            stroke="currentColor"
                                            fill="transparent"
                                            r="40"
                                            cx="48"
                                            cy="48"
                                        />
                                    </svg>
                                    <Target className="absolute w-10 h-10 text-red-500" />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold">
                                    Daily goal completed: <span className="text-gray-900">{completedToday}/{dailyGoal} tasks</span>
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {completedToday >= dailyGoal ? "Excellent work!" : `Keep going, ${userName}!`}
                                </p>
                                <button className="text-xs text-red-500 mt-2 hover:underline">Edit goal</button>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 text-left">
                                <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Daily Streak</h4>
                                <div className="flex items-center gap-2">
                                    <Flame className="w-5 h-5 text-orange-500" />
                                    <span className="text-lg font-bold">{dailyStreak} days</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Longest streak: {longestStreak} days</p>
                            </div>

                            <div className="text-left">
                                <h4 className="text-xs font-semibold text-gray-700 mb-3">Completed in the last 7 days</h4>
                                <div className="flex items-end justify-between h-24 gap-1">
                                    {last7DaysData.map((d, i) => (
                                        <div key={i} className="flex flex-col items-center gap-1 w-full group relative">
                                            <div
                                                className={cn("w-full rounded-sm transition-all duration-500", d.isToday ? "bg-red-500" : "bg-gray-300")}
                                                style={{ height: `${Math.max(d.count * 10, 4)}px`, maxHeight: '80px' }}
                                            />
                                            <span className={cn("text-[10px]", d.isToday ? "font-bold text-gray-900" : "text-gray-400")}>
                                                {d.day.charAt(0)}
                                            </span>
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                {d.count} tasks on {d.fullDate}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'weekly' && (
                        <div className="space-y-6 text-center animate-in fade-in zoom-in duration-300">
                            <div className="scale-110 py-4">
                                <div className="relative inline-flex items-center justify-center">
                                    <svg className="w-24 h-24 transform -rotate-90">
                                        <circle
                                            className="text-gray-200"
                                            strokeWidth="8"
                                            stroke="currentColor"
                                            fill="transparent"
                                            r="40"
                                            cx="48"
                                            cy="48"
                                        />
                                        <circle
                                            className="text-red-500 transition-all duration-1000 ease-out"
                                            strokeWidth="8"
                                            strokeDasharray={251.2}
                                            strokeDashoffset={251.2 - (251.2 * Math.min(completedThisWeek / weeklyGoal, 1))}
                                            strokeLinecap="round"
                                            stroke="currentColor"
                                            fill="transparent"
                                            r="40"
                                            cx="48"
                                            cy="48"
                                        />
                                    </svg>
                                    <Trophy className="absolute w-10 h-10 text-red-500" />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold">
                                    Weekly goal: <span className="text-gray-900">{completedThisWeek}/{weeklyGoal} tasks</span>
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    You're doing great!
                                </p>
                                <button className="text-xs text-red-500 mt-2 hover:underline">Edit goal</button>
                            </div>

                            <div className="text-left">
                                <h4 className="text-xs font-semibold text-gray-700 mb-3">Completed in the last 4 weeks</h4>
                                <div className="space-y-3">
                                    {last4WeeksData.map((d, i) => (
                                        <div key={i} className="flex flex-col gap-1">
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>{d.label}</span>
                                                <span className="font-medium text-gray-900">{d.count}</span>
                                            </div>
                                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full", i === 3 ? "bg-red-500" : "bg-blue-500")}
                                                    style={{ width: `${Math.min((d.count / d.goal) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'karma' && (
                        <div className="space-y-6 text-center animate-in fade-in zoom-in duration-300">
                            <div className="flex flex-col items-center justify-center gap-2 py-4">
                                <div className="w-20 h-20 rounded-full border-4 border-red-100 flex items-center justify-center bg-white shadow-sm">
                                    <Flame className="w-10 h-10 text-red-500" />
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Karma Level</p>
                                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-red-500">
                                    {karmaLevel} ({currentKarma})
                                </h3>
                                <p className="text-sm text-gray-500 mt-2 px-8">
                                    You've mastered the productivity secrets of the universe!
                                </p>
                                <button className="text-xs text-red-500 mt-2 hover:underline">About Karma Levels</button>
                            </div>

                            <div className="text-left pt-4">
                                <h4 className="text-xs font-semibold text-gray-700 mb-3">Karma Trend</h4>
                                <div className="h-32 w-full bg-gradient-to-t from-red-50 to-transparent border-b border-gray-200 relative flex items-end">
                                    {/* Simple line graph visualization with SVG */}
                                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                        <path
                                            d="M0,128 C20,120 50,100 100,90 C150,80 200,60 250,50 C300,40 350,20 400,10"
                                            fill="none"
                                            stroke="rgb(239, 68, 68)"
                                            strokeWidth="2"
                                            vectorEffect="non-scaling-stroke"
                                        />
                                        <path
                                            d="M0,128 C20,120 50,100 100,90 C150,80 200,60 250,50 C300,40 350,20 400,10 V128 H0"
                                            fill="rgba(239, 68, 68, 0.1)"
                                        />
                                    </svg>

                                    {/* X-Axis labels mock */}
                                    <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[10px] text-gray-400 px-1">
                                        <span>Mon</span>
                                        <span>Tue</span>
                                        <span>Wed</span>
                                        <span>Thu</span>
                                        <span>Fri</span>
                                        <span>Sat</span>
                                        <span>Sun</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t flex justify-center">
                    <button className="text-xs font-medium text-red-500 hover:underline">
                        {activeTab === 'karma' ? 'Karma Goals and Settings' : 'Edit Daily & Weekly Goals'}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
