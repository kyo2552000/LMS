'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible + 2) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (page > 3) pages.push('...');

            const start = Math.max(2, page - 1);
            const end = Math.min(totalPages - 1, page + 1);
            for (let i = start; i <= end; i++) pages.push(i);

            if (page < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
                Hiển thị {Math.min((page - 1) * 15 + 1, total)}–{Math.min(page * 15, total)} trên {total}
            </p>
            <div className="flex items-center space-x-1">
                <Button
                    size="sm"
                    variant="ghost"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    className="h-7 w-7 p-0 cursor-pointer"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {getPageNumbers().map((p, i) =>
                    typeof p === 'string' ? (
                        <span key={`dots-${i}`} className="px-1 text-xs text-gray-400">…</span>
                    ) : (
                        <Button
                            key={p}
                            size="sm"
                            variant={p === page ? 'default' : 'ghost'}
                            onClick={() => onPageChange(p)}
                            className={`h-7 w-7 p-0 text-xs cursor-pointer ${p === page
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {p}
                        </Button>
                    )
                )}

                <Button
                    size="sm"
                    variant="ghost"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                    className="h-7 w-7 p-0 cursor-pointer"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
