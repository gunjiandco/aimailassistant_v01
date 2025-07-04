
import React, { useState, useMemo } from 'react';
import holiday_jp from '@holiday-jp/holiday_jp';
import { Task, TaskStatus } from '../types';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface MiniCalendarProps {
    tasks: Task[];
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ tasks }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [hoveredTasksInfo, setHoveredTasksInfo] = useState<{ tasks: Task[]; top: number; left: number; date: Date } | null>(null);

    const tasksByDate = useMemo(() => {
        const map = new Map<string, Task[]>();
        tasks.forEach(task => {
            const taskDate = new Date(task.dueDate + 'T00:00:00');
            const dateKey = taskDate.toISOString().split('T')[0];
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)!.push(task);
        });
        return map;
    }, [tasks]);

    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const handleSetToday = () => setCurrentDate(new Date());

    const calendarGrid = useMemo(() => {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const startDate = new Date(monthStart);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        const days = [];
        let day = new Date(startDate);
        for (let i = 0; i < 42; i++) {
            days.push(new Date(day));
            day.setDate(day.getDate() + 1);
        }
        return days;
    }, [currentDate]);
    
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    {currentDate.toLocaleString('ja-JP', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex items-center gap-1">
                    <button onClick={handlePrevMonth} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                        <ChevronLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-300"/>
                    </button>
                    <button onClick={handleSetToday} className="text-xs font-semibold px-2 py-1 rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">
                        今日
                    </button>
                    <button onClick={handleNextMonth} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                        <ChevronRightIcon className="w-5 h-5 text-slate-600 dark:text-slate-300"/>
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                {weekDays.map((wd, index) => <div key={wd} className={`py-1 ${index === 0 ? 'text-red-600 dark:text-red-400' : ''} ${index === 6 ? 'text-blue-600 dark:text-blue-400' : ''}`}>{wd}</div>)}
            </div>
            <div className="grid grid-cols-7 mt-1">
                {calendarGrid.map((d, index) => {
                    const dateKey = d.toISOString().split('T')[0];
                    const tasksForDay = tasksByDate.get(dateKey) || [];
                    const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                    const isToday = d.toDateString() === new Date().toDateString();
                    const isSunday = d.getDay() === 0;
                    const isSaturday = d.getDay() === 6;
                    const isHoliday = holiday_jp.isHoliday(d);

                    const dayClasses = ['text-sm flex items-center justify-center w-7 h-7 rounded-full transition-colors'];
                    if (isToday) dayClasses.push('bg-primary-500 text-white font-semibold');
                    else {
                        if (isCurrentMonth) {
                            if (isSunday || isHoliday) dayClasses.push('text-red-600 dark:text-red-400');
                            else if (isSaturday) dayClasses.push('text-blue-600 dark:text-blue-400');
                            else dayClasses.push('text-slate-700 dark:text-slate-300');
                        } else {
                            dayClasses.push('text-slate-400 dark:text-slate-600');
                        }
                        dayClasses.push('hover:bg-slate-200 dark:hover:bg-slate-700');
                    }

                    return (
                        <div 
                            key={index} 
                            className="relative h-9 flex items-center justify-center"
                            onMouseEnter={(e) => {
                                if (tasksForDay.length > 0) {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setHoveredTasksInfo({
                                        tasks: tasksForDay,
                                        top: rect.bottom + window.scrollY + 5,
                                        left: rect.left + window.scrollX + rect.width / 2,
                                        date: d,
                                    });
                                }
                            }}
                            onMouseLeave={() => setHoveredTasksInfo(null)}
                        >
                            <span className={dayClasses.join(' ')}>{d.getDate()}</span>
                            {tasksForDay.length > 0 && <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white pointer-events-none">{tasksForDay.length}</span>}
                        </div>
                    );
                })}
            </div>
            {hoveredTasksInfo && (
                <div
                    style={{ position: 'fixed', top: `${hoveredTasksInfo.top}px`, left: `${hoveredTasksInfo.left}px`, transform: 'translateX(-50%)' }}
                    className="z-50 bg-slate-800 text-white p-3 rounded-lg shadow-xl w-60 pointer-events-none animate-fade-in-up"
                    role="tooltip"
                >
                    <h4 className="font-bold border-b border-slate-600 pb-1 mb-2 text-sm">
                        {hoveredTasksInfo.date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}のタスク
                    </h4>
                    <ul className="space-y-1">
                        {hoveredTasksInfo.tasks.map(task => (
                            <li key={task.id} className="text-xs flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${task.status === TaskStatus.Done ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                                <span className={`${task.status === TaskStatus.Done ? 'line-through text-slate-400' : ''}`}>{task.title}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default MiniCalendar;
