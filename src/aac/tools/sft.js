module.exports = class ScaleFactorTable
{
    static get SCALEFACTOR_TABLE() {
        return SCALEFACTOR_TABLE;
    }
};

const SCALEFACTOR_TABLE = (() => {
    const table = new Float32Array(428);

    for (let i = 0; i < 428; i++) {
        table[i] = Math.pow(2, (i - 200) / 4);
    }

    return table;
})();