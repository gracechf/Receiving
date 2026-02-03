import React, { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, ScatterChart, Scatter, LineChart, Line
} from 'recharts';
import { AlertTriangle, CheckCircle, XCircle, Activity } from 'lucide-react';
import _ from 'lodash';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const FAIL_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16'];

const Dashboard = ({ data, stats, outliers }) => {
    const [selectedMetric, setSelectedMetric] = useState('Tab Height');
    const [selectedNeedle, setSelectedNeedle] = useState('E1');

    // Prepare Metric Data for Scatter Plot
    const metricData = useMemo(() => {
        return data.map((d, i) => ({
            id: `${d['Sheet Number']}-${d['Sensor Position']}`,
            index: i,
            val: d[selectedMetric],
            status: d['Pass/Fail']
        })).filter(d => !isNaN(d.val));
    }, [data, selectedMetric]);

    // Prepare Width Profile Data (Aggregated)
    const widthProfileData = useMemo(() => {
        const points = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50,
            0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90, 0.95, 1.00,
            1.05, 1.10, 1.15, 1.20, 1.25, 1.30, 1.35, 1.40, 1.45, 1.50,
            1.55, 1.60, 1.65, 1.70, 1.75, 1.80, 1.85, 1.90, 1.95, 2.00];

        return points.map(point => {
            const pStr = point.toFixed(2);
            const colName = `${selectedNeedle} Needle Width ${pStr}`;

            const values = data.map(d => d[colName]).filter(v => !isNaN(v));
            const avg = values.length ? _.mean(values) : 0;

            return {
                length: pStr,
                width: avg
            };
        });
    }, [data, selectedNeedle]);

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card title="Total Sheets" value={stats.total} icon={<Activity />} color="bg-blue-50 text-blue-700" />
                <Card title="Passed" value={stats.passed} icon={<CheckCircle />} color="bg-green-50 text-green-700" />
                <Card title="Failed" value={stats.failed} icon={<XCircle />} color="bg-red-50 text-red-700" />
                <Card title="Pass Rate" value={`${stats.passRate}%`} icon={<Activity />} color="bg-purple-50 text-purple-700" />
            </div>

            {/* Failure Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold mb-4">Failure Modes</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.failureModes} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                                <RechartsTooltip />
                                <Bar dataKey="value" fill="#ef4444" name="Count" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold mb-4">Dominant Failing Needle</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.failureNeedles}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {stats.failureNeedles.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Metric Analysis */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Metric Distribution</h3>
                    <select
                        value={selectedMetric}
                        onChange={(e) => setSelectedMetric(e.target.value)}
                        className="p-2 border rounded-md text-sm"
                    >
                        {[
                            'Tab Height', 'Tab to Bridge Height',
                            'E1 Needle Height', 'E1 Tab to Needle Tip',
                            'E3 Needle Height', 'E3 Tab to Needle Tip',
                            'E5 Needle Height', 'E5 Tab to Needle Tip',
                            'E1_AvgWidth', 'E3_AvgWidth', 'E5_AvgWidth'
                        ].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart>
                            <CartesianGrid />
                            <XAxis type="number" dataKey="index" name="Sensor Index" />
                            <YAxis type="number" dataKey="val" name="Value" domain={['auto', 'auto']} />
                            <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                            <Scatter name={selectedMetric} data={metricData} fill="#0088FE" />
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Needle Width Profiles */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Average Needle Width Profile</h3>
                    <div className="flex gap-2">
                        {['E1', 'E3', 'E5'].map(n => (
                            <button
                                key={n}
                                onClick={() => setSelectedNeedle(n)}
                                className={`px-3 py-1 rounded ${selectedNeedle === n ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={widthProfileData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="length" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Line type="monotone" dataKey="width" stroke="#8884d8" name={`Avg Width ${selectedNeedle}`} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Outliers Table */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="text-amber-500" />
                    <h3 className="text-lg font-semibold">Performance Deviations (Z-Score &gt; 3)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Sensor ID</th>
                                <th className="px-6 py-3">Metric</th>
                                <th className="px-6 py-3">Value</th>
                                <th className="px-6 py-3">Deviation</th>
                                <th className="px-6 py-3">Z-Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {outliers.slice(0, 10).map((o, i) => (
                                <tr key={i} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium">{o.id}</td>
                                    <td className="px-6 py-4">{o.metric}</td>
                                    <td className="px-6 py-4 text-red-600 font-bold">{o.value.toFixed(4)}</td>
                                    <td className="px-6 py-4">{o.deviation}</td>
                                    <td className="px-6 py-4">{o.zScore}</td>
                                </tr>
                            ))}
                            {outliers.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No major deviations detected.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Raw Data Table */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Detailed Data View</h3>
                <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                {Object.keys(data[0] || {}).filter(k =>
                                    !k.includes('WidthProfile') && !k.includes('failureMode')
                                ).map(header => (
                                    <th key={header} className="px-6 py-3 whitespace-nowrap border-b bg-gray-50">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.slice(0, 100).map((row, i) => (
                                <tr key={i} className="bg-white border-b hover:bg-gray-50">
                                    {Object.keys(data[0] || {}).filter(k =>
                                        !k.includes('WidthProfile') && !k.includes('failureMode')
                                    ).map(header => (
                                        <td key={`${i}-${header}`} className="px-6 py-4 whitespace-nowrap">
                                            {typeof row[header] === 'number' ? row[header].toFixed(4) : row[header]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="mt-2 text-xs text-gray-500 text-center">Showing first 100 rows for performance.</p>
                </div>
            </div>

        </div>
    );
};

const Card = ({ title, value, icon, color }) => (
    <div className={`p-6 rounded-lg shadow-sm border flex items-center justify-between ${color.replace('text-', 'border-').replace('bg-', 'bg-opacity-10 ')}`}>
        <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
    </div>
);

export default Dashboard;
