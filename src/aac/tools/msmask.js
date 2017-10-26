/**
 * The MSMask indicates, if MS is applied to a specific ICStream.
 * @author in-somnia
 */

module.exports = class MSMask
{
    static get TYPE_ALL_0() { return 0; };
    static get TYPE_USED() { return 1; }
    static get TYPE_ALL_1() { return 2; }
    static get TYPE_RESERVED() { return 3; }

    static forInt(int) {
        switch (int) {
            case MSMask.TYPE_ALL_0:
            case MSMask.TYPE_USED:
            case MSMask.TYPE_ALL_1:
            case MSMask.TYPE_RESERVED:
                return int;
            default:
                throw "unknown MS mask type";
        }
    }
};
