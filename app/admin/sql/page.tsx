'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Loader2, AlertCircle, Check, Trash2, Clock } from 'lucide-react';

interface QueryResult {
    rows?: Record<string, unknown>[];
    affectedRows?: number;
    insertId?: number;
    type?: string;
    error?: string;
}

interface HistoryItem {
    query: string;
    time: string;
    success: boolean;
}

const exampleQueries = [
    { label: 'All Users', query: 'SELECT * FROM users;' },
    { label: 'All Courses', query: 'SELECT c.title, c.price, c.rating, cat.name as category, u.name as instructor\nFROM courses c\nJOIN categories cat ON c.category_id = cat.id\nJOIN users u ON c.instructor_id = u.id;' },
    { label: 'Enrollments', query: 'SELECT u.name, c.title, e.progress, e.status\nFROM enrollments e\nJOIN users u ON e.user_id = u.id\nJOIN courses c ON e.course_id = c.id;' },
    { label: 'Table Info', query: "SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'edulearn';" },
];

export default function SqlQueryPage() {
    const [query, setQuery] = useState('SELECT * FROM users;');
    const [result, setResult] = useState<QueryResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);

    const executeQuery = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setResult(null);

        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                setResult({ error: data.error });
                setHistory((h) => [{ query: query.trim(), time: new Date().toLocaleTimeString(), success: false }, ...h.slice(0, 19)]);
            } else {
                setResult(data);
                setHistory((h) => [{ query: query.trim(), time: new Date().toLocaleTimeString(), success: true }, ...h.slice(0, 19)]);
            }
        } catch {
            setResult({ error: 'Network error' });
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            executeQuery();
        }
    };

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">SQL Query Editor</h1>
                <p className="text-gray-500 mt-1">Execute raw SQL queries on the edulearn database</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Editor */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Query Input */}
                    <Card className="rounded-xl border-0 shadow-sm overflow-hidden">
                        <div className="bg-gray-900 px-4 py-2 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="text-gray-400 text-xs ml-2 font-mono">SQL Editor</span>
                            </div>
                            <span className="text-gray-500 text-xs">Ctrl+Enter to execute</span>
                        </div>
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={8}
                            placeholder="Enter your SQL query here..."
                            className="w-full px-4 py-3 font-mono text-sm bg-gray-950 text-green-400 resize-y focus:outline-none placeholder:text-gray-600"
                            spellCheck={false}
                        />
                        <div className="bg-gray-900 px-4 py-2 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                {exampleQueries.map((eq) => (
                                    <button
                                        key={eq.label}
                                        onClick={() => setQuery(eq.query)}
                                        className="px-2 py-1 rounded text-xs bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors cursor-pointer"
                                    >
                                        {eq.label}
                                    </button>
                                ))}
                            </div>
                            <Button
                                onClick={executeQuery}
                                disabled={loading || !query.trim()}
                                className="bg-green-600 hover:bg-green-700 text-white cursor-pointer h-8 px-4 text-sm"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                                Execute
                            </Button>
                        </div>
                    </Card>

                    {/* Results */}
                    {result && (
                        <Card className="rounded-xl border-0 shadow-sm overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 border-b flex items-center space-x-2">
                                {result.error ? (
                                    <>
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                        <span className="text-sm font-medium text-red-600">Error</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 text-green-500" />
                                        <span className="text-sm font-medium text-green-600">
                                            {result.type === 'select'
                                                ? `${result.rows?.length || 0} rows returned`
                                                : `${result.affectedRows} rows affected`}
                                        </span>
                                    </>
                                )}
                            </div>
                            <CardContent className="p-0">
                                {result.error ? (
                                    <div className="p-4 text-red-600 text-sm font-mono bg-red-50">
                                        {result.error}
                                    </div>
                                ) : result.type === 'select' && result.rows && result.rows.length > 0 ? (
                                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="sticky top-0">
                                                <tr className="bg-gray-100 border-b">
                                                    {Object.keys(result.rows[0]).map((key) => (
                                                        <th key={key} className="px-3 py-2 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">
                                                            {key}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {result.rows.map((row, i) => (
                                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                                                        {Object.values(row).map((val, j) => (
                                                            <td key={j} className="px-3 py-2 whitespace-nowrap text-gray-700 max-w-[300px] truncate font-mono text-xs">
                                                                {val === null ? <span className="text-gray-300 italic">NULL</span> : String(val)}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : result.type === 'mutation' ? (
                                    <div className="p-4 text-green-700 text-sm">
                                        ✅ Query executed successfully. {result.affectedRows} row(s) affected.
                                        {result.insertId ? ` Insert ID: ${result.insertId}` : ''}
                                    </div>
                                ) : (
                                    <div className="p-4 text-gray-500 text-sm">No results</div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar: History */}
                <div className="space-y-4">
                    <Card className="rounded-xl border-0 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-900 text-sm">Query History</h3>
                                {history.length > 0 && (
                                    <button
                                        onClick={() => setHistory([])}
                                        className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                            {history.length === 0 ? (
                                <p className="text-gray-400 text-xs">No queries yet</p>
                            ) : (
                                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                    {history.map((h, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setQuery(h.query)}
                                            className="w-full text-left p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
                                        >
                                            <div className="flex items-center space-x-1.5 mb-1">
                                                {h.success ? (
                                                    <Check className="h-3 w-3 text-green-500" />
                                                ) : (
                                                    <AlertCircle className="h-3 w-3 text-red-500" />
                                                )}
                                                <span className="text-[10px] text-gray-400 flex items-center">
                                                    <Clock className="h-2.5 w-2.5 mr-0.5" />
                                                    {h.time}
                                                </span>
                                            </div>
                                            <code className="text-xs text-gray-600 line-clamp-2 font-mono">
                                                {h.query}
                                            </code>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
