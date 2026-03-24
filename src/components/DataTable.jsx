import { Edit, Trash2 } from 'lucide-react';

const DataTable = ({ columns, data, onEdit, onDelete, actionLabel = "Actions" }) => {
    return (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-100 custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                    <tr>
                        {columns.map((col, index) => (
                            <th
                                key={index}
                                className="px-4 sm:px-6 py-4 text-left text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest"
                            >
                                {col.header}
                            </th>
                        ))}
                        {(onEdit || onDelete) && (
                            <th className="px-4 sm:px-6 py-4 text-right text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">
                                {actionLabel}
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="px-4 sm:px-6 py-8 text-center text-gray-400 italic">
                                No data available
                            </td>
                        </tr>
                    ) : (
                        data.map((row, rowIndex) => (
                            <tr key={row._id || rowIndex} className="hover:bg-indigo-50/30 transition-colors group">
                                {columns.map((col, colIndex) => (
                                    <td key={colIndex} className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {col.render ? col.render(row) : row[col.accessor]}
                                    </td>
                                ))}
                                {(onEdit || onDelete) && (
                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-2">
                                            {onEdit && (
                                                <button
                                                    onClick={() => onEdit(row)}
                                                    className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 rounded-md transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    onClick={() => onDelete(row)}
                                                    className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-100 rounded-md transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;
