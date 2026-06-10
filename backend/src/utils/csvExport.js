// src/utils/csvExport.js
export const generateCSV = (expenses) => {
    let csv = "Amount,Category,Date,Type\n";
    expenses.forEach(e => {
        csv += `${e.amount},${e.category},${e.date.toISOString()},${e.type}\n`;
    });
    return csv;
};