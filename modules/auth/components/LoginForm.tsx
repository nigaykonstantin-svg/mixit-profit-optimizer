'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/modules/auth/auth-service';
import { USERS, UserId, USER_ROLES } from '@/modules/users';
import { Card, Button, Input } from '@/modules/shared';
import { LogIn, User, Users } from 'lucide-react';

export function LoginForm() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const user = login(username.toLowerCase(), password);
        if (!user) {
            setError('Неверный логин или пароль');
            return;
        }

        if (user.role === USER_ROLES.LEADER) {
            router.push('/leader');
        } else {
            router.push('/executor');
        }
    };

    const handleQuickLogin = (userId: UserId) => {
        setUsername(userId);
        setPassword('demo');
        setTimeout(() => {
            const user = login(userId, 'demo');
            if (user) {
                if (user.role === USER_ROLES.LEADER) {
                    router.push('/leader');
                } else {
                    router.push('/executor');
                }
            }
        }, 100);
    };

    if (!mounted) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-purple-200">
                        <Users className="text-white" size={28} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">MIXIT Manager</h1>
                    <p className="text-gray-500 mt-1">Панель управления маркетплейсом</p>
                </div>

                {/* Login Form */}
                <Card variant="elevated" padding="lg" className="rounded-3xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Логин
                            </label>
                            <Input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Введите логин"
                                icon={<User size={18} />}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Пароль
                            </label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Введите пароль"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <Button type="submit" fullWidth>
                            <LogIn size={18} />
                            Войти
                        </Button>
                    </form>

                    {/* Quick Login */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-sm text-gray-500 text-center mb-4">
                            Быстрый вход (demo)
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(USERS).map(([id, user]) => (
                                <Button
                                    key={id}
                                    variant="secondary"
                                    onClick={() => handleQuickLogin(id as UserId)}
                                    className={user.role === USER_ROLES.LEADER ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : ''}
                                >
                                    <span>{user.avatar}</span>
                                    {user.name}
                                </Button>
                            ))}
                        </div>
                    </div>
                </Card>

                <p className="text-center text-sm text-gray-400 mt-6">
                    Пароль для всех аккаунтов: <code className="bg-gray-100 px-2 py-1 rounded">demo</code>
                </p>
            </div>
        </div>
    );
}
