'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, AuthUser } from '@/modules/auth';
import { USER_ROLES } from '@/modules/users';
import { Card, Button } from '@/modules/shared';
import { Upload, FileSpreadsheet, Check, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

const IMPORT_TYPES = [
    { id: 'wb_funnel', label: 'WB Funnel', description: 'Полная воронка (4-я вкладка)' },
    { id: 'wb_sales', label: 'WB Sales', description: 'Продажи и выручка' },
    { id: 'wb_orders', label: 'WB Orders', description: 'Заказы и конверсия' },
    { id: 'wb_stock', label: 'WB Stock', description: 'Остатки на складе' },
    { id: 'wb_advertising', label: 'WB Advertising', description: 'Реклама и ДРР' },
] as const;

type ImportType = typeof IMPORT_TYPES[number]['id'];

interface ImportResult {
    success: boolean;
    recordsProcessed?: number;
    recordsImported?: number;
    errors?: string[];
    error?: string;
}

export default function ImportPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [mounted, setMounted] = useState(false);

    const [selectedType, setSelectedType] = useState<ImportType>('wb_funnel');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);

    useEffect(() => {
        setMounted(true);
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== USER_ROLES.LEADER) {
            router.push('/');
            return;
        }
        setUser(currentUser);
    }, [router]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setResult(null);
        }
    };

    const handleImport = async () => {
        if (!selectedFile) return;

        setImporting(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('importType', selectedType);

            const response = await fetch('/api/import', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({
                success: false,
                error: String(error),
            });
        } finally {
            setImporting(false);
        }
    };

    const handleReset = () => {
        setSelectedFile(null);
        setResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
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
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                            <Upload className="text-white" size={20} />
                        </div>
                        <div>
                            <h1 className="font-semibold text-gray-900">Импорт данных</h1>
                            <p className="text-sm text-gray-500">Загрузка файлов Wildberries</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Import Type Selection */}
                <Card>
                    <h2 className="font-semibold text-gray-900 mb-4">Тип данных</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {IMPORT_TYPES.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setSelectedType(type.id)}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${selectedType === type.id
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="font-medium text-gray-900">{type.label}</div>
                                <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                            </button>
                        ))}
                    </div>
                </Card>

                {/* File Upload */}
                <Card>
                    <h2 className="font-semibold text-gray-900 mb-4">Файл .xlsx</h2>

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${selectedFile
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {selectedFile ? (
                            <div className="flex items-center justify-center gap-3">
                                <FileSpreadsheet className="text-green-600" size={32} />
                                <div className="text-left">
                                    <div className="font-medium text-gray-900">{selectedFile.name}</div>
                                    <div className="text-sm text-gray-500">
                                        {(selectedFile.size / 1024).toFixed(1)} KB
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Upload className="mx-auto text-gray-400 mb-3" size={32} />
                                <div className="text-gray-600">Нажмите для выбора файла</div>
                                <div className="text-sm text-gray-400 mt-1">или перетащите .xlsx файл сюда</div>
                            </>
                        )}
                    </div>

                    {selectedFile && (
                        <div className="mt-4 flex gap-3">
                            <Button onClick={handleImport} disabled={importing}>
                                {importing ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Импорт...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={18} />
                                        Импортировать
                                    </>
                                )}
                            </Button>
                            <Button variant="secondary" onClick={handleReset}>
                                Сбросить
                            </Button>
                        </div>
                    )}
                </Card>

                {/* Result */}
                {result && (
                    <Card>
                        <div className={`flex items-start gap-3 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                            {result.success ? (
                                <Check className="mt-0.5" size={20} />
                            ) : (
                                <AlertCircle className="mt-0.5" size={20} />
                            )}
                            <div>
                                <div className="font-semibold">
                                    {result.success ? 'Импорт завершён' : 'Ошибка импорта'}
                                </div>
                                {result.recordsProcessed !== undefined && (
                                    <div className="text-sm mt-1">
                                        Обработано: {result.recordsProcessed} | Импортировано: {result.recordsImported}
                                    </div>
                                )}
                                {result.error && (
                                    <div className="text-sm mt-1">{result.error}</div>
                                )}
                                {result.errors && result.errors.length > 0 && (
                                    <ul className="text-sm mt-2 space-y-1">
                                        {result.errors.map((err, i) => (
                                            <li key={i}>• {err}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </Card>
                )}

                {/* Column Mapping Info */}
                <Card>
                    <h3 className="font-semibold text-gray-900 mb-3">Ожидаемые колонки</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="font-medium text-gray-700 mb-1">WB Sales:</div>
                            <div className="text-gray-500">date, sku, price, revenue</div>
                        </div>
                        <div>
                            <div className="font-medium text-gray-700 mb-1">WB Orders:</div>
                            <div className="text-gray-500">date, sku, views, clicks, cart, orders, ctr</div>
                        </div>
                        <div>
                            <div className="font-medium text-gray-700 mb-1">WB Stock:</div>
                            <div className="text-gray-500">sku, stock (quantity)</div>
                        </div>
                        <div>
                            <div className="font-medium text-gray-700 mb-1">WB Advertising:</div>
                            <div className="text-gray-500">date, sku, drr_search, drr_media</div>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                        Также поддерживаются русские названия колонок: Дата, Артикул, Цена, Выручка, Просмотры, и т.д.
                    </p>
                </Card>
            </main>
        </div>
    );
}
