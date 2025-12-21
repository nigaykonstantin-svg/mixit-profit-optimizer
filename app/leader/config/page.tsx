'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, AuthUser } from '@/modules/auth';
import { USER_ROLES } from '@/modules/users';
import { Card, Button, Input } from '@/modules/shared';
import {
    getCategoryConfigs,
    updateCategoryConfig,
    CONFIG_FIELDS,
    ConfigFieldKey
} from '@/modules/config';
import { CategoryConfig } from '@/analytics-engine/wb/wb-config-loader';
import { Settings, Save, ArrowLeft, Check } from 'lucide-react';

const CATEGORIES = ['FACE', 'HAIR', 'BODY', 'MAKEUP'] as const;

export default function ConfigPage() {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('FACE');
    const [configs, setConfigs] = useState<CategoryConfig[]>([]);
    const [editedConfig, setEditedConfig] = useState<CategoryConfig | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setMounted(true);
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== USER_ROLES.LEADER) {
            router.push('/');
            return;
        }
        setUser(currentUser);
        loadConfigs();
    }, [router]);

    const loadConfigs = async () => {
        const data = await getCategoryConfigs();
        setConfigs(data);
        const activeConfig = data.find(c => c.category === activeTab);
        if (activeConfig) {
            setEditedConfig({ ...activeConfig });
        }
    };

    const handleTabChange = (category: string) => {
        setActiveTab(category);
        const config = configs.find(c => c.category === category);
        if (config) {
            setEditedConfig({ ...config });
        }
        setSaved(false);
    };

    const handleFieldChange = (key: ConfigFieldKey, value: number) => {
        if (!editedConfig) return;
        setEditedConfig({
            ...editedConfig,
            [key]: value,
        });
        setSaved(false);
    };

    const handleSave = async () => {
        if (!editedConfig) return;
        setSaving(true);

        await updateCategoryConfig(editedConfig.category, editedConfig);

        // Reload configs
        await loadConfigs();

        setSaving(false);
        setSaved(true);

        // Reset saved indicator after 3 seconds
        setTimeout(() => setSaved(false), 3000);
    };

    if (!mounted || !user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/leader')}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <Settings className="text-white" size={20} />
                        </div>
                        <div>
                            <h1 className="font-semibold text-gray-900">Настройки Price Engine</h1>
                            <p className="text-sm text-gray-500">Конфигурация по категориям</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Category Tabs */}
                <div className="flex gap-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => handleTabChange(cat)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === cat
                                ? 'bg-gray-900 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Config Form */}
                {editedConfig && (
                    <Card>
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Категория: {editedConfig.category}
                            </h2>
                            <p className="text-sm text-gray-500">
                                Настройки порогов и правил для категории
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {CONFIG_FIELDS.map((field) => (
                                <div key={field.key}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {field.label}
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            type="number"
                                            value={editedConfig[field.key as keyof CategoryConfig] as number}
                                            onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
                                            min={field.min}
                                            max={field.max}
                                            step={field.step}
                                        />
                                        <input
                                            type="range"
                                            value={editedConfig[field.key as keyof CategoryConfig] as number}
                                            onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
                                            min={field.min}
                                            max={field.max}
                                            step={field.step}
                                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                Изменения применяются к правилам Price Engine автоматически
                            </p>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saved ? (
                                    <>
                                        <Check size={18} />
                                        Сохранено
                                    </>
                                ) : saving ? (
                                    'Сохранение...'
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Сохранить
                                    </>
                                )}
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Rules Preview */}
                <Card>
                    <h3 className="font-semibold text-gray-900 mb-4">Применяемые правила</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                        <p>• <strong>STOP:</strong> Если прибыль ≤ 0 → цена вверх, реклама пауза</p>
                        <p>• <strong>CLEAR:</strong> Если запасов ≥ {editedConfig?.stock_overstock_days || 120} дней → цена вниз</p>
                        <p>• <strong>LOW_STOCK:</strong> Если запасов ≤ {editedConfig?.stock_critical_days || 10} дней → цена вверх</p>
                        <p>• <strong>OVERPRICED:</strong> Если CTR ≥ {editedConfig?.ctr_warning || 2.0}% и CR {'<'} {editedConfig?.cr_order_warning || 2.5}% → цена вниз</p>
                        <p>• <strong>DRR_SPIKE:</strong> Если ДРР {'>'} {editedConfig?.drr_warning || 20}% → реклама снизить</p>
                        <p>• <strong>Шаг цены:</strong> ±{editedConfig?.price_step_pct || 3}%</p>
                    </div>
                </Card>
            </main>
        </div>
    );
}
