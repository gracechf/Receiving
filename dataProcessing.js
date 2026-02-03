import _ from 'lodash';

export const processData = (data) => {
    const cleanData = data.filter(row => row['Lot Number'] && row['Sheet Number']); // Filter empty rows

    const numericColumns = [
        'Tab Height', 'Tab to Bridge Height',
        'E1 Needle Height', 'E1 Tab to Needle Tip',
        'E3 Needle Height', 'E3 Tab to Needle Tip',
        'E5 Needle Height', 'E5 Tab to Needle Tip',
    ];

    // Helper to check if a key is a width measurement
    const isWidthCol = (key) => key.includes('Needle Width');

    const processed = cleanData.map(row => {
        const newRow = { ...row };

        // Convert numerics
        numericColumns.forEach(col => {
            newRow[col] = parseFloat(row[col]);
        });

        // Convert Needle Width columns to numbers
        Object.keys(row).forEach(key => {
            if (key.includes('Needle Width')) {
                newRow[key] = parseFloat(row[key]);
            }
        });

        // Calculate Average Widths
        ['E1', 'E3', 'E5'].forEach(needle => {
            const widthCols = Object.keys(row).filter(key => key.startsWith(`${needle} Needle Width`));
            const widths = widthCols.map(key => parseFloat(row[key])).filter(val => !isNaN(val));
            newRow[`${needle}_AvgWidth`] = widths.length ? _.mean(widths) : null;
            newRow[`${needle}_WidthProfile`] = widthCols.map(key => ({
                length: parseFloat(key.split('Width ')[1]),
                width: parseFloat(row[key])
            })).sort((a, b) => a.length - b.length);
        });

        // Parse Failure Modes
        if (row['Pass/Fail'] === 'FAIL') {
            newRow.failureMode = parseFailureComment(row['Comment']);
        } else {
            newRow.failureMode = null;
        }

        return newRow;
    });

    const stats = calculateStats(processed);
    const outliers = detectOutliers(processed, numericColumns);

    return {
        data: processed,
        stats,
        outliers
    };
};

const parseFailureComment = (comment) => {
    if (!comment) return { needle: 'Unknown', reason: 'Unknown' };

    const normalized = comment.toUpperCase();
    let needle = 'General';
    let reason = comment;

    // Check for specific needle prefixes
    if (normalized.includes('E1') || normalized.includes('EL1')) needle = 'E1';
    else if (normalized.includes('E3') || normalized.includes('EL3')) needle = 'E3';
    else if (normalized.includes('E5') || normalized.includes('EL5')) needle = 'E5';

    // Attempt to clean reason
    // Remove ELx/Ex prefixes
    reason = reason.replace(/EL?[135][;:\s-]*/gi, '').trim();

    // Capitalize first letter
    reason = reason.charAt(0).toUpperCase() + reason.slice(1);

    if (!reason) reason = 'Unspecified';

    return { needle, reason };
};

const calculateStats = (data) => {
    const total = data.length;
    const passed = data.filter(d => d['Pass/Fail'] === 'PASS').length;
    const failed = total - passed;

    const failureModes = _.countBy(data.filter(d => d.failureMode), 'failureMode.reason');
    const failureNeedles = _.countBy(data.filter(d => d.failureMode), 'failureMode.needle');

    return {
        total,
        passed,
        failed,
        passRate: ((passed / total) * 100).toFixed(1),
        failureModes: Object.entries(failureModes).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
        failureNeedles: Object.entries(failureNeedles).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    };
};

const detectOutliers = (data, columns) => {
    const outliers = [];

    columns.forEach(col => {
        const values = data.map(d => d[col]).filter(v => !isNaN(v));
        const mean = _.mean(values);
        const std = stdDev(values);
        const threshold = 3 * std;

        data.forEach(d => {
            const val = d[col];
            if (!isNaN(val) && Math.abs(val - mean) > threshold) {
                outliers.push({
                    id: `${d['Lot Number']}-${d['Sheet Number']}-${d['Sensor Position']}`,
                    metric: col,
                    value: val,
                    deviation: Math.abs(val - mean).toFixed(4),
                    zScore: ((val - mean) / std).toFixed(2)
                });
            }
        });
    });

    return outliers.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
};

const stdDev = (arr) => {
    if (!arr || arr.length === 0) return 0;
    const n = arr.length;
    const mean = arr.reduce((a, b) => a + b) / n;
    return Math.sqrt(arr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
};
