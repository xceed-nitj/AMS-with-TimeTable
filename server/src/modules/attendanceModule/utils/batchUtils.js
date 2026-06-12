const generateBatchName = (program, department, batchYear) => {
    const safeProgram = String(program || '').trim().replace(/[\s-]+/g, '_').toUpperCase();
    const safeDepartment = String(department || '').trim().replace(/[\s-]+/g, '_').toUpperCase();
    const safeYear = String(batchYear || '').trim().toUpperCase();

    if (!safeProgram || !safeDepartment || !safeYear) {
        throw new Error('Program, Department, and Batch Year are required to generate a batch name.');
    }
    return `${safeProgram}_${safeDepartment}_${safeYear}`;
};

module.exports = {
    generateBatchName
};
