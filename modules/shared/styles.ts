// Shared styles and common values
export const STYLES = {
    gradients: {
        primary: 'bg-gradient-to-r from-violet-500 to-purple-600',
        primaryHover: 'hover:from-violet-600 hover:to-purple-700',
        leaderBg: 'bg-gradient-to-br from-violet-50 via-white to-purple-50',
        executorBg: 'bg-gradient-to-br from-blue-50 via-white to-indigo-50',
    },
    buttons: {
        primary: 'py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:from-violet-600 hover:to-purple-700 transition-all',
        secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl',
        danger: 'text-gray-400 hover:text-red-500 transition-colors',
    },
    cards: {
        base: 'bg-white rounded-2xl shadow-sm border border-gray-100',
        hover: 'hover:shadow-md transition-shadow',
    },
    inputs: {
        base: 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none',
    },
    badges: {
        base: 'px-3 py-1 rounded-full text-xs font-medium',
    },
} as const;
