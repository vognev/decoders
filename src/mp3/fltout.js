const Short = {
    MAX_VALUE: Math.pow(2, 15) - 1,
    MIN_VALUE: -Math.pow(2, 15)
};

class SampleBuffer {
    constructor(frequency, channels) {
        this.buffer = [];
        this.bufferp = [];

        this.channels = channels;
        this.frequency = frequency;

        for (let i = 0; i < channels; ++i)
            this.bufferp[i] = i;
    }

    appendSamples(channel, f) {
        let pos = this.bufferp[channel], fs;

        for (let i = 0; i < 32;) {
            fs = f[i++];
            fs = (fs > Short.MAX_VALUE ? Short.MAX_VALUE : (fs < Short.MIN_VALUE ? Short.MIN_VALUE : fs));
            this.buffer[pos] = fs ^ 0;
            pos += this.channels;
        }

        this.bufferp[channel] = pos;
    }

    clear() {
        for (let i = 0; i < this.channels; ++i)
            this.bufferp[i] = i;
    }

    asBuffer() {
        const outBuf = new Buffer(this.buffer.length * 2);

        let outPos = 0;
        for (let i = 0; i < this.buffer.length; i++) {
            const s = Math.max(Math.min(Math.round(this.buffer[i]), Short.MAX_VALUE), Short.MIN_VALUE);
            outBuf.writeInt16LE(s, outPos);
            outPos += 2;
        }

        return outBuf;
    }
}

class SynthesisFilter {
    constructor(channelnumber, factor, eq0 = null) {
        // private float[] _tmpOut = new float[32];
        this._tmpOut = new Float32Array(32);

        this.actual_v = null;
        this.actual_write_pos = 0;

        // private float[] v1 = new float[512];
        this.v1 = (new Float32Array(512)).fill(0);
        // private float[] v2 = new float[512];
        this.v2 = (new Float32Array(512)).fill(0);

        // private float[] samples = new float[32]
        this.samples = (new Float32Array(32)).fill(0);

        this.channel        = channelnumber;
        this.scalefactor    = factor;

        this.setEQ(eq0);
        this.reset();
    }

    setEQ(eq) {
        this.eq = eq || (new Float32Array(32)).fill(1);
    }

    reset() {
        this.v1.fill(0);
        this.v2.fill(0);
        this.samples.fill(0);

        this.actual_v = this.v1;
        this.actual_write_pos = 15;
    }

    input_samples(s) {
        for (let i = 31; i >= 0; i--) {
            this.samples[i] = s[i] * this.eq[i];
        }
    }

    calculate_pcm_samples(buffer) {
        this.compute_new_v();
        this.compute_pcm_samples(buffer);

        this.actual_write_pos = (this.actual_write_pos + 1) & 0xf;
        this.actual_v = (this.actual_v === this.v1) ? this.v2 : this.v1;

        for (let p = 0; p < 32; p++)
            this.samples[p] = 0.0;
    }

    compute_new_v() {
        let new_v0, new_v1, new_v2, new_v3, new_v4, new_v5, new_v6, new_v7, new_v8, new_v9;
        let new_v10, new_v11, new_v12, new_v13, new_v14, new_v15, new_v16, new_v17, new_v18, new_v19;
        let new_v20, new_v21, new_v22, new_v23, new_v24, new_v25, new_v26, new_v27, new_v28, new_v29;
        let new_v30, new_v31;

        new_v0  = new_v1  = new_v2  = new_v3  = new_v4  = new_v5  = new_v6  = new_v7  = new_v8  = new_v9 =
        new_v10 = new_v11 = new_v12 = new_v13 = new_v14 = new_v15 = new_v16 = new_v17 = new_v18 = new_v19 =
        new_v20 = new_v21 = new_v22 = new_v23 = new_v24 = new_v25 = new_v26 = new_v27 = new_v28 = new_v29 =
        new_v30 = new_v31 = 0.0;

        const s = this.samples;

        let s0 = s[0];
        let s1 = s[1];
        let s2 = s[2];
        let s3 = s[3];
        let s4 = s[4];
        let s5 = s[5];
        let s6 = s[6];
        let s7 = s[7];
        let s8 = s[8];
        let s9 = s[9];
        let s10 = s[10];
        let s11 = s[11];
        let s12 = s[12];
        let s13 = s[13];
        let s14 = s[14];
        let s15 = s[15];
        let s16 = s[16];
        let s17 = s[17];
        let s18 = s[18];
        let s19 = s[19];
        let s20 = s[20];
        let s21 = s[21];
        let s22 = s[22];
        let s23 = s[23];
        let s24 = s[24];
        let s25 = s[25];
        let s26 = s[26];
        let s27 = s[27];
        let s28 = s[28];
        let s29 = s[29];
        let s30 = s[30];
        let s31 = s[31];

        let p0 = s0 + s31;
        let p1 = s1 + s30;
        let p2 = s2 + s29;
        let p3 = s3 + s28;
        let p4 = s4 + s27;
        let p5 = s5 + s26;
        let p6 = s6 + s25;
        let p7 = s7 + s24;
        let p8 = s8 + s23;
        let p9 = s9 + s22;
        let p10 = s10 + s21;
        let p11 = s11 + s20;
        let p12 = s12 + s19;
        let p13 = s13 + s18;
        let p14 = s14 + s17;
        let p15 = s15 + s16;

        let pp0 = p0 + p15;
        let pp1 = p1 + p14;
        let pp2 = p2 + p13;
        let pp3 = p3 + p12;
        let pp4 = p4 + p11;
        let pp5 = p5 + p10;
        let pp6 = p6 + p9;
        let pp7 = p7 + p8;
        let pp8 = (p0 - p15) * cos1_32;
        let pp9 = (p1 - p14) * cos3_32;
        let pp10 = (p2 - p13) * cos5_32;
        let pp11 = (p3 - p12) * cos7_32;
        let pp12 = (p4 - p11) * cos9_32;
        let pp13 = (p5 - p10) * cos11_32;
        let pp14 = (p6 - p9) * cos13_32;
        let pp15 = (p7 - p8) * cos15_32;

        p0 = pp0 + pp7;
        p1 = pp1 + pp6;
        p2 = pp2 + pp5;
        p3 = pp3 + pp4;
        p4 = (pp0 - pp7) * cos1_16;
        p5 = (pp1 - pp6) * cos3_16;
        p6 = (pp2 - pp5) * cos5_16;
        p7 = (pp3 - pp4) * cos7_16;
        p8 = pp8 + pp15;
        p9 = pp9 + pp14;
        p10 = pp10 + pp13;
        p11 = pp11 + pp12;
        p12 = (pp8 - pp15) * cos1_16;
        p13 = (pp9 - pp14) * cos3_16;
        p14 = (pp10 - pp13) * cos5_16;
        p15 = (pp11 - pp12) * cos7_16;

        pp0 = p0 + p3;
        pp1 = p1 + p2;
        pp2 = (p0 - p3) * cos1_8;
        pp3 = (p1 - p2) * cos3_8;
        pp4 = p4 + p7;
        pp5 = p5 + p6;
        pp6 = (p4 - p7) * cos1_8;
        pp7 = (p5 - p6) * cos3_8;
        pp8 = p8 + p11;
        pp9 = p9 + p10;
        pp10 = (p8 - p11) * cos1_8;
        pp11 = (p9 - p10) * cos3_8;
        pp12 = p12 + p15;
        pp13 = p13 + p14;
        pp14 = (p12 - p15) * cos1_8;
        pp15 = (p13 - p14) * cos3_8;

        p0 = pp0 + pp1;
        p1 = (pp0 - pp1) * cos1_4;
        p2 = pp2 + pp3;
        p3 = (pp2 - pp3) * cos1_4;
        p4 = pp4 + pp5;
        p5 = (pp4 - pp5) * cos1_4;
        p6 = pp6 + pp7;
        p7 = (pp6 - pp7) * cos1_4;
        p8 = pp8 + pp9;
        p9 = (pp8 - pp9) * cos1_4;
        p10 = pp10 + pp11;
        p11 = (pp10 - pp11) * cos1_4;
        p12 = pp12 + pp13;
        p13 = (pp12 - pp13) * cos1_4;
        p14 = pp14 + pp15;
        p15 = (pp14 - pp15) * cos1_4;

        // this is pretty insane coding
        let tmp1;
        new_v19/*36-17*/ = -(new_v4 = (new_v12 = p7) + p5) - p6;
        new_v27/*44-17*/ = -p6 - p7 - p4;
        new_v6 = (new_v10 = (new_v14 = p15) + p11) + p13;
        new_v17/*34-17*/ = -(new_v2 = p15 + p13 + p9) - p14;
        new_v21/*38-17*/ = (tmp1 = -p14 - p15 - p10 - p11) - p13;
        new_v29/*46-17*/ = -p14 - p15 - p12 - p8;
        new_v25/*42-17*/ = tmp1 - p12;
        new_v31/*48-17*/ = -p0;
        new_v0 = p1;
        new_v23/*40-17*/ = -(new_v8 = p3) - p2;

        p0 = (s0 - s31) * cos1_64;
        p1 = (s1 - s30) * cos3_64;
        p2 = (s2 - s29) * cos5_64;
        p3 = (s3 - s28) * cos7_64;
        p4 = (s4 - s27) * cos9_64;
        p5 = (s5 - s26) * cos11_64;
        p6 = (s6 - s25) * cos13_64;
        p7 = (s7 - s24) * cos15_64;
        p8 = (s8 - s23) * cos17_64;
        p9 = (s9 - s22) * cos19_64;
        p10 = (s10 - s21) * cos21_64;
        p11 = (s11 - s20) * cos23_64;
        p12 = (s12 - s19) * cos25_64;
        p13 = (s13 - s18) * cos27_64;
        p14 = (s14 - s17) * cos29_64;
        p15 = (s15 - s16) * cos31_64;

        pp0 = p0 + p15;
        pp1 = p1 + p14;
        pp2 = p2 + p13;
        pp3 = p3 + p12;
        pp4 = p4 + p11;
        pp5 = p5 + p10;
        pp6 = p6 + p9;
        pp7 = p7 + p8;
        pp8 = (p0 - p15) * cos1_32;
        pp9 = (p1 - p14) * cos3_32;
        pp10 = (p2 - p13) * cos5_32;
        pp11 = (p3 - p12) * cos7_32;
        pp12 = (p4 - p11) * cos9_32;
        pp13 = (p5 - p10) * cos11_32;
        pp14 = (p6 - p9) * cos13_32;
        pp15 = (p7 - p8) * cos15_32;

        p0 = pp0 + pp7;
        p1 = pp1 + pp6;
        p2 = pp2 + pp5;
        p3 = pp3 + pp4;
        p4 = (pp0 - pp7) * cos1_16;
        p5 = (pp1 - pp6) * cos3_16;
        p6 = (pp2 - pp5) * cos5_16;
        p7 = (pp3 - pp4) * cos7_16;
        p8 = pp8 + pp15;
        p9 = pp9 + pp14;
        p10 = pp10 + pp13;
        p11 = pp11 + pp12;
        p12 = (pp8 - pp15) * cos1_16;
        p13 = (pp9 - pp14) * cos3_16;
        p14 = (pp10 - pp13) * cos5_16;
        p15 = (pp11 - pp12) * cos7_16;

        pp0 = p0 + p3;
        pp1 = p1 + p2;
        pp2 = (p0 - p3) * cos1_8;
        pp3 = (p1 - p2) * cos3_8;
        pp4 = p4 + p7;
        pp5 = p5 + p6;
        pp6 = (p4 - p7) * cos1_8;
        pp7 = (p5 - p6) * cos3_8;
        pp8 = p8 + p11;
        pp9 = p9 + p10;
        pp10 = (p8 - p11) * cos1_8;
        pp11 = (p9 - p10) * cos3_8;
        pp12 = p12 + p15;
        pp13 = p13 + p14;
        pp14 = (p12 - p15) * cos1_8;
        pp15 = (p13 - p14) * cos3_8;

        p0 = pp0 + pp1;
        p1 = (pp0 - pp1) * cos1_4;
        p2 = pp2 + pp3;
        p3 = (pp2 - pp3) * cos1_4;
        p4 = pp4 + pp5;
        p5 = (pp4 - pp5) * cos1_4;
        p6 = pp6 + pp7;
        p7 = (pp6 - pp7) * cos1_4;
        p8 = pp8 + pp9;
        p9 = (pp8 - pp9) * cos1_4;
        p10 = pp10 + pp11;
        p11 = (pp10 - pp11) * cos1_4;
        p12 = pp12 + pp13;
        p13 = (pp12 - pp13) * cos1_4;
        p14 = pp14 + pp15;
        p15 = (pp14 - pp15) * cos1_4;

        // manually doing something that a compiler should handle sucks
        // coding like this is hard to read
        let tmp2;
        new_v5 = (new_v11 = (new_v13 = (new_v15 = p15) + p7) + p11)
            + p5 + p13;
        new_v7 = (new_v9 = p15 + p11 + p3) + p13;
        new_v16/*33-17*/ = -(new_v1 = (tmp1 = p13 + p15 + p9) + p1) - p14;
        new_v18/*35-17*/ = -(new_v3 = tmp1 + p5 + p7) - p6 - p14;

        new_v22/*39-17*/ = (tmp1 = -p10 - p11 - p14 - p15)
            - p13 - p2 - p3;
        new_v20/*37-17*/ = tmp1 - p13 - p5 - p6 - p7;
        new_v24/*41-17*/ = tmp1 - p12 - p2 - p3;
        new_v26/*43-17*/ = tmp1 - p12 - (tmp2 = p4 + p6 + p7);
        new_v30/*47-17*/ = (tmp1 = -p8 - p12 - p14 - p15) - p0;
        new_v28/*45-17*/ = tmp1 - tmp2;

        // insert V[0-15] (== new_v[0-15]) into actual v:
        // float[] x2 = actual_v + actual_write_pos;
        let dest = this.actual_v;
        let pos  = this.actual_write_pos;

        dest[0 + pos] = new_v0;
        dest[16 + pos] = new_v1;
        dest[32 + pos] = new_v2;
        dest[48 + pos] = new_v3;
        dest[64 + pos] = new_v4;
        dest[80 + pos] = new_v5;
        dest[96 + pos] = new_v6;
        dest[112 + pos] = new_v7;
        dest[128 + pos] = new_v8;
        dest[144 + pos] = new_v9;
        dest[160 + pos] = new_v10;
        dest[176 + pos] = new_v11;
        dest[192 + pos] = new_v12;
        dest[208 + pos] = new_v13;
        dest[224 + pos] = new_v14;
        dest[240 + pos] = new_v15;

        // V[16] is always 0.0:
        dest[256 + pos] = 0.0;

        // insert V[17-31] (== -new_v[15-1]) into actual v:
        dest[272 + pos] = -new_v15;
        dest[288 + pos] = -new_v14;
        dest[304 + pos] = -new_v13;
        dest[320 + pos] = -new_v12;
        dest[336 + pos] = -new_v11;
        dest[352 + pos] = -new_v10;
        dest[368 + pos] = -new_v9;
        dest[384 + pos] = -new_v8;
        dest[400 + pos] = -new_v7;
        dest[416 + pos] = -new_v6;
        dest[432 + pos] = -new_v5;
        dest[448 + pos] = -new_v4;
        dest[464 + pos] = -new_v3;
        dest[480 + pos] = -new_v2;
        dest[496 + pos] = -new_v1;

        // insert V[32] (== -new_v[0]) into other v:
        dest = (this.actual_v === this.v1) ? this.v2 : this.v1;

        dest[0 + pos] = -new_v0;
        // insert V[33-48] (== new_v[16-31]) into other v:
        dest[16 + pos] = new_v16;
        dest[32 + pos] = new_v17;
        dest[48 + pos] = new_v18;
        dest[64 + pos] = new_v19;
        dest[80 + pos] = new_v20;
        dest[96 + pos] = new_v21;
        dest[112 + pos] = new_v22;
        dest[128 + pos] = new_v23;
        dest[144 + pos] = new_v24;
        dest[160 + pos] = new_v25;
        dest[176 + pos] = new_v26;
        dest[192 + pos] = new_v27;
        dest[208 + pos] = new_v28;
        dest[224 + pos] = new_v29;
        dest[240 + pos] = new_v30;
        dest[256 + pos] = new_v31;

        // insert V[49-63] (== new_v[30-16]) into other v:
        dest[272 + pos] = new_v30;
        dest[288 + pos] = new_v29;
        dest[304 + pos] = new_v28;
        dest[320 + pos] = new_v27;
        dest[336 + pos] = new_v26;
        dest[352 + pos] = new_v25;
        dest[368 + pos] = new_v24;
        dest[384 + pos] = new_v23;
        dest[400 + pos] = new_v22;
        dest[416 + pos] = new_v21;
        dest[432 + pos] = new_v20;
        dest[448 + pos] = new_v19;
        dest[464 + pos] = new_v18;
        dest[480 + pos] = new_v17;
        dest[496 + pos] = new_v16;
    }

    compute_pcm_samples0(buffer) {
        const vp = this.actual_v;
        const tmpOut = this._tmpOut;
        let dvp = 0;

        // fat chance of having this loop unroll
        for (let i = 0; i < 32; i++) {
            let pcm_sample;
            const dp = d16[i];
            pcm_sample = (((vp[dvp] * dp[0]) +
                (vp[15 + dvp] * dp[1]) +
                (vp[14 + dvp] * dp[2]) +
                (vp[13 + dvp] * dp[3]) +
                (vp[12 + dvp] * dp[4]) +
                (vp[11 + dvp] * dp[5]) +
                (vp[10 + dvp] * dp[6]) +
                (vp[9 + dvp] * dp[7]) +
                (vp[8 + dvp] * dp[8]) +
                (vp[7 + dvp] * dp[9]) +
                (vp[6 + dvp] * dp[10]) +
                (vp[5 + dvp] * dp[11]) +
                (vp[4 + dvp] * dp[12]) +
                (vp[3 + dvp] * dp[13]) +
                (vp[2 + dvp] * dp[14]) +
                (vp[1 + dvp] * dp[15])
            ) * this.scalefactor);

            tmpOut[i] = pcm_sample;

            dvp += 16;
        } // for
    }

    compute_pcm_samples1(buffer) {
        const vp = this.actual_v;
        const tmpOut = this._tmpOut;
        let dvp = 0;

        // fat chance of having this loop unroll
        for (let i = 0; i < 32; i++) {
            const dp = d16[i];
            let pcm_sample;

            pcm_sample = (((vp[1 + dvp] * dp[0]) +
                (vp[0 + dvp] * dp[1]) +
                (vp[15 + dvp] * dp[2]) +
                (vp[14 + dvp] * dp[3]) +
                (vp[13 + dvp] * dp[4]) +
                (vp[12 + dvp] * dp[5]) +
                (vp[11 + dvp] * dp[6]) +
                (vp[10 + dvp] * dp[7]) +
                (vp[9 + dvp] * dp[8]) +
                (vp[8 + dvp] * dp[9]) +
                (vp[7 + dvp] * dp[10]) +
                (vp[6 + dvp] * dp[11]) +
                (vp[5 + dvp] * dp[12]) +
                (vp[4 + dvp] * dp[13]) +
                (vp[3 + dvp] * dp[14]) +
                (vp[2 + dvp] * dp[15])
            ) * this.scalefactor);

            tmpOut[i] = pcm_sample;

            dvp += 16;
        } // for
    }

    compute_pcm_samples2(buffer) {
        const vp = this.actual_v;
        const tmpOut = this._tmpOut;
        let dvp = 0;

        // fat chance of having this loop unroll
        for (let i = 0; i < 32; i++) {
            const dp = d16[i];
            let pcm_sample;

            pcm_sample = (((vp[2 + dvp] * dp[0]) +
                (vp[1 + dvp] * dp[1]) +
                (vp[0 + dvp] * dp[2]) +
                (vp[15 + dvp] * dp[3]) +
                (vp[14 + dvp] * dp[4]) +
                (vp[13 + dvp] * dp[5]) +
                (vp[12 + dvp] * dp[6]) +
                (vp[11 + dvp] * dp[7]) +
                (vp[10 + dvp] * dp[8]) +
                (vp[9 + dvp] * dp[9]) +
                (vp[8 + dvp] * dp[10]) +
                (vp[7 + dvp] * dp[11]) +
                (vp[6 + dvp] * dp[12]) +
                (vp[5 + dvp] * dp[13]) +
                (vp[4 + dvp] * dp[14]) +
                (vp[3 + dvp] * dp[15])
            ) * this.scalefactor);

            tmpOut[i] = pcm_sample;

            dvp += 16;
        } // for
    }

    compute_pcm_samples3(buffer) {
        const vp = this.actual_v;
        const tmpOut = this._tmpOut;
        let dvp = 0;

        // fat chance of having this loop unroll
        for (let i = 0; i < 32; i++) {
            const dp = d16[i];
            let pcm_sample;

            pcm_sample = (((vp[3 + dvp] * dp[0]) +
                (vp[2 + dvp] * dp[1]) +
                (vp[1 + dvp] * dp[2]) +
                (vp[0 + dvp] * dp[3]) +
                (vp[15 + dvp] * dp[4]) +
                (vp[14 + dvp] * dp[5]) +
                (vp[13 + dvp] * dp[6]) +
                (vp[12 + dvp] * dp[7]) +
                (vp[11 + dvp] * dp[8]) +
                (vp[10 + dvp] * dp[9]) +
                (vp[9 + dvp] * dp[10]) +
                (vp[8 + dvp] * dp[11]) +
                (vp[7 + dvp] * dp[12]) +
                (vp[6 + dvp] * dp[13]) +
                (vp[5 + dvp] * dp[14]) +
                (vp[4 + dvp] * dp[15])
            ) * this.scalefactor);

            tmpOut[i] = pcm_sample;

            dvp += 16;
        } // for
    }

    compute_pcm_samples4(buffer) {
        const vp = this.actual_v;
        const tmpOut = this._tmpOut;
        let dvp = 0;

        // fat chance of having this loop unroll
        for (let i = 0; i < 32; i++) {
            const dp = d16[i];
            let pcm_sample;

            pcm_sample = (((vp[4 + dvp] * dp[0]) +
                (vp[3 + dvp] * dp[1]) +
                (vp[2 + dvp] * dp[2]) +
                (vp[1 + dvp] * dp[3]) +
                (vp[0 + dvp] * dp[4]) +
                (vp[15 + dvp] * dp[5]) +
                (vp[14 + dvp] * dp[6]) +
                (vp[13 + dvp] * dp[7]) +
                (vp[12 + dvp] * dp[8]) +
                (vp[11 + dvp] * dp[9]) +
                (vp[10 + dvp] * dp[10]) +
                (vp[9 + dvp] * dp[11]) +
                (vp[8 + dvp] * dp[12]) +
                (vp[7 + dvp] * dp[13]) +
                (vp[6 + dvp] * dp[14]) +
                (vp[5 + dvp] * dp[15])
            ) * this.scalefactor);

            tmpOut[i] = pcm_sample;

            dvp += 16;
        } // for
    }

    compute_pcm_samples5(buffer) {
        const vp = this.actual_v;

        const tmpOut = this._tmpOut;
        let dvp = 0;

        // fat chance of having this loop unroll
        for (let i = 0; i < 32; i++) {
            const dp = d16[i];
            let pcm_sample;

            pcm_sample = (((vp[5 + dvp] * dp[0]) +
                (vp[4 + dvp] * dp[1]) +
                (vp[3 + dvp] * dp[2]) +
                (vp[2 + dvp] * dp[3]) +
                (vp[1 + dvp] * dp[4]) +
                (vp[0 + dvp] * dp[5]) +
                (vp[15 + dvp] * dp[6]) +
                (vp[14 + dvp] * dp[7]) +
                (vp[13 + dvp] * dp[8]) +
                (vp[12 + dvp] * dp[9]) +
                (vp[11 + dvp] * dp[10]) +
                (vp[10 + dvp] * dp[11]) +
                (vp[9 + dvp] * dp[12]) +
                (vp[8 + dvp] * dp[13]) +
                (vp[7 + dvp] * dp[14]) +
                (vp[6 + dvp] * dp[15])
            ) * this.scalefactor);

            tmpOut[i] = pcm_sample;

            dvp += 16;
        } // for
    }

    compute_pcm_samples6(buffer) {
        const vp = this.actual_v;
        const tmpOut = this._tmpOut;
        let dvp = 0;

        // fat chance of having this loop unroll
        for (let i = 0; i < 32; i++) {
            const dp = d16[i];
            let pcm_sample;

            pcm_sample = (((vp[6 + dvp] * dp[0]) +
                (vp[5 + dvp] * dp[1]) +
                (vp[4 + dvp] * dp[2]) +
                (vp[3 + dvp] * dp[3]) +
                (vp[2 + dvp] * dp[4]) +
                (vp[1 + dvp] * dp[5]) +
                (vp[0 + dvp] * dp[6]) +
                (vp[15 + dvp] * dp[7]) +
                (vp[14 + dvp] * dp[8]) +
                (vp[13 + dvp] * dp[9]) +
                (vp[12 + dvp] * dp[10]) +
                (vp[11 + dvp] * dp[11]) +
                (vp[10 + dvp] * dp[12]) +
                (vp[9 + dvp] * dp[13]) +
                (vp[8 + dvp] * dp[14]) +
                (vp[7 + dvp] * dp[15])
            ) * this.scalefactor);

            tmpOut[i] = pcm_sample;

            dvp += 16;
        } // for
    }

    compute_pcm_samples7(buffer) {
        const vp = this.actual_v;
        const tmpOut = this._tmpOut;
        let dvp = 0;

        // fat chance of having this loop unroll
        for (let i = 0; i < 32; i++) {
            const dp = d16[i];
            let pcm_sample;

            pcm_sample = (((vp[7 + dvp] * dp[0]) +
                (vp[6 + dvp] * dp[1]) +
                (vp[5 + dvp] * dp[2]) +
                (vp[4 + dvp] * dp[3]) +
                (vp[3 + dvp] * dp[4]) +
                (vp[2 + dvp] * dp[5]) +
                (vp[1 + dvp] * dp[6]) +
                (vp[0 + dvp] * dp[7]) +
                (vp[15 + dvp] * dp[8]) +
                (vp[14 + dvp] * dp[9]) +
                (vp[13 + dvp] * dp[10]) +
                (vp[12 + dvp] * dp[11]) +
                (vp[11 + dvp] * dp[12]) +
                (vp[10 + dvp] * dp[13]) +
                (vp[9 + dvp] * dp[14]) +
                (vp[8 + dvp] * dp[15])
            ) * this.scalefactor);

            tmpOut[i] = pcm_sample;

            dvp += 16;
        } // for
    }

    compute_pcm_samples8(buffer) {
        const vp = this.actual_v;
        const tmpOut = this._tmpOut;
        let dvp = 0;

        // fat chance of having this loop unroll
        for (let i = 0; i < 32; i++) {
            const dp = d16[i];
            let pcm_sample;

            pcm_sample = (((vp[8 + dvp] * dp[0]) +
                (vp[7 + dvp] * dp[1]) +
                (vp[6 + dvp] * dp[2]) +
                (vp[5 + dvp] * dp[3]) +
                (vp[4 + dvp] * dp[4]) +
                (vp[3 + dvp] * dp[5]) +
                (vp[2 + dvp] * dp[6]) +
                (vp[1 + dvp] * dp[7]) +
                (vp[0 + dvp] * dp[8]) +
                (vp[15 + dvp] * dp[9]) +
                (vp[14 + dvp] * dp[10]) +
                (vp[13 + dvp] * dp[11]) +
                (vp[12 + dvp] * dp[12]) +
                (vp[11 + dvp] * dp[13]) +
                (vp[10 + dvp] * dp[14]) +
                (vp[9 + dvp] * dp[15])
            ) * this.scalefactor);

            tmpOut[i] = pcm_sample;

            dvp += 16;
        } // for
    }

    compute_pcm_samples9(buffer) {
        const vp = this.actual_v;
        const tmpOut = this._tmpOut;
        let dvp = 0;

        // fat chance of having this loop unroll
        for (let i = 0; i < 32; i++) {
            const dp = d16[i];
            let pcm_sample;

            pcm_sample = (((vp[9 + dvp] * dp[0]) +
                (vp[8 + dvp] * dp[1]) +
                (vp[7 + dvp] * dp[2]) +
                (vp[6 + dvp] * dp[3]) +
                (vp[5 + dvp] * dp[4]) +
                (vp[4 + dvp] * dp[5]) +
                (vp[3 + dvp] * dp[6]) +
                (vp[2 + dvp] * dp[7]) +
                (vp[1 + dvp] * dp[8]) +
                (vp[0 + dvp] * dp[9]) +
                (vp[15 + dvp] * dp[10]) +
                (vp[14 + dvp] * dp[11]) +
                (vp[13 + dvp] * dp[12]) +
                (vp[12 + dvp] * dp[13]) +
                (vp[11 + dvp] * dp[14]) +
                (vp[10 + dvp] * dp[15])
            ) * this.scalefactor);

            tmpOut[i] = pcm_sample;

            dvp += 16;
        } // for
    }

    compute_pcm_samples10(buffer) {
        const vp = this.actual_v;
        const tmpOut = this._tmpOut;
        let dvp = 0;

        // fat chance of having this loop unroll
        for (let i = 0; i < 32; i++) {
            const dp = d16[i];
            let pcm_sample;

            pcm_sample = (((vp[10 + dvp] * dp[0]) +
                (vp[9 + dvp] * dp[1]) +
                (vp[8 + dvp] * dp[2]) +
                (vp[7 + dvp] * dp[3]) +
                (vp[6 + dvp] * dp[4]) +
                (vp[5 + dvp] * dp[5]) +
                (vp[4 + dvp] * dp[6]) +
                (vp[3 + dvp] * dp[7]) +
                (vp[2 + dvp] * dp[8]) +
                (vp[1 + dvp] * dp[9]) +
                (vp[0 + dvp] * dp[10]) +
                (vp[15 + dvp] * dp[11]) +
                (vp[14 + dvp] * dp[12]) +
                (vp[13 + dvp] * dp[13]) +
                (vp[12 + dvp] * dp[14]) +
                (vp[11 + dvp] * dp[15])
            ) * this.scalefactor);

            tmpOut[i] = pcm_sample;

            dvp += 16;
        } // for
    }

    compute_pcm_samples11(buffer) {
        const vp = this.actual_v;
        const tmpOut = this._tmpOut;
        let dvp = 0;

        // fat chance of having this loop unroll
        for (let i = 0; i < 32; i++) {
            const dp = d16[i];
            let pcm_sample;

            pcm_sample = (((vp[11 + dvp] * dp[0]) +
                (vp[10 + dvp] * dp[1]) +
                (vp[9 + dvp] * dp[2]) +
                (vp[8 + dvp] * dp[3]) +
                (vp[7 + dvp] * dp[4]) +
                (vp[6 + dvp] * dp[5]) +
                (vp[5 + dvp] * dp[6]) +
                (vp[4 + dvp] * dp[7]) +
                (vp[3 + dvp] * dp[8]) +
                (vp[2 + dvp] * dp[9]) +
                (vp[1 + dvp] * dp[10]) +
                (vp[0 + dvp] * dp[11]) +
                (vp[15 + dvp] * dp[12]) +
                (vp[14 + dvp] * dp[13]) +
                (vp[13 + dvp] * dp[14]) +
                (vp[12 + dvp] * dp[15])
            ) * this.scalefactor);

            tmpOut[i] = pcm_sample;

            dvp += 16;
        } // for
    }

    compute_pcm_samples12(buffer) {
        const vp = this.actual_v;
        const tmpOut = this._tmpOut;
        let dvp = 0;

        // fat chance of having this loop unroll
        for (let i = 0; i < 32; i++) {
            const dp = d16[i];
            let pcm_sample;

            pcm_sample = (((vp[12 + dvp] * dp[0]) +
                (vp[11 + dvp] * dp[1]) +
                (vp[10 + dvp] * dp[2]) +
                (vp[9 + dvp] * dp[3]) +
                (vp[8 + dvp] * dp[4]) +
                (vp[7 + dvp] * dp[5]) +
                (vp[6 + dvp] * dp[6]) +
                (vp[5 + dvp] * dp[7]) +
                (vp[4 + dvp] * dp[8]) +
                (vp[3 + dvp] * dp[9]) +
                (vp[2 + dvp] * dp[10]) +
                (vp[1 + dvp] * dp[11]) +
                (vp[0 + dvp] * dp[12]) +
                (vp[15 + dvp] * dp[13]) +
                (vp[14 + dvp] * dp[14]) +
                (vp[13 + dvp] * dp[15])
            ) * this.scalefactor);

            tmpOut[i] = pcm_sample;

            dvp += 16;
        } // for
    }

    compute_pcm_samples13(buffer) {
        const vp = this.actual_v;
        const tmpOut = this._tmpOut;
        let dvp = 0;

        // fat chance of having this loop unroll
        for (let i = 0; i < 32; i++) {
            const dp = d16[i];
            let pcm_sample;

            pcm_sample = (((vp[13 + dvp] * dp[0]) +
                (vp[12 + dvp] * dp[1]) +
                (vp[11 + dvp] * dp[2]) +
                (vp[10 + dvp] * dp[3]) +
                (vp[9 + dvp] * dp[4]) +
                (vp[8 + dvp] * dp[5]) +
                (vp[7 + dvp] * dp[6]) +
                (vp[6 + dvp] * dp[7]) +
                (vp[5 + dvp] * dp[8]) +
                (vp[4 + dvp] * dp[9]) +
                (vp[3 + dvp] * dp[10]) +
                (vp[2 + dvp] * dp[11]) +
                (vp[1 + dvp] * dp[12]) +
                (vp[0 + dvp] * dp[13]) +
                (vp[15 + dvp] * dp[14]) +
                (vp[14 + dvp] * dp[15])
            ) * this.scalefactor);

            tmpOut[i] = pcm_sample;

            dvp += 16;
        } // for
    }

    compute_pcm_samples14(buffer) {
        const vp = this.actual_v;
        const tmpOut = this._tmpOut;
        let dvp = 0;

        // fat chance of having this loop unroll
        for (let i = 0; i < 32; i++) {
            const dp = d16[i];
            let pcm_sample;

            pcm_sample = (((vp[14 + dvp] * dp[0]) +
                (vp[13 + dvp] * dp[1]) +
                (vp[12 + dvp] * dp[2]) +
                (vp[11 + dvp] * dp[3]) +
                (vp[10 + dvp] * dp[4]) +
                (vp[9 + dvp] * dp[5]) +
                (vp[8 + dvp] * dp[6]) +
                (vp[7 + dvp] * dp[7]) +
                (vp[6 + dvp] * dp[8]) +
                (vp[5 + dvp] * dp[9]) +
                (vp[4 + dvp] * dp[10]) +
                (vp[3 + dvp] * dp[11]) +
                (vp[2 + dvp] * dp[12]) +
                (vp[1 + dvp] * dp[13]) +
                (vp[0 + dvp] * dp[14]) +
                (vp[15 + dvp] * dp[15])
            ) * this.scalefactor);

            tmpOut[i] = pcm_sample;

            dvp += 16;
        } // for
    }

    compute_pcm_samples15(buffer) {
        const vp = this.actual_v;
        const tmpOut = this._tmpOut;
        let dvp = 0;

        // fat chance of having this loop unroll
        for (let i = 0; i < 32; i++) {
            const dp = d16[i];
            let pcm_sample;

            pcm_sample = (((vp[15 + dvp] * dp[0]) +
                (vp[14 + dvp] * dp[1]) +
                (vp[13 + dvp] * dp[2]) +
                (vp[12 + dvp] * dp[3]) +
                (vp[11 + dvp] * dp[4]) +
                (vp[10 + dvp] * dp[5]) +
                (vp[9 + dvp] * dp[6]) +
                (vp[8 + dvp] * dp[7]) +
                (vp[7 + dvp] * dp[8]) +
                (vp[6 + dvp] * dp[9]) +
                (vp[5 + dvp] * dp[10]) +
                (vp[4 + dvp] * dp[11]) +
                (vp[3 + dvp] * dp[12]) +
                (vp[2 + dvp] * dp[13]) +
                (vp[1 + dvp] * dp[14]) +
                (vp[0 + dvp] * dp[15])
            ) * this.scalefactor);

            tmpOut[i] = pcm_sample;

            dvp += 16;
        } // for
    }

    compute_pcm_samples(buffer) {
        switch (this.actual_write_pos) {
            case 0:
                this.compute_pcm_samples0(buffer);
                break;
            case 1:
                this.compute_pcm_samples1(buffer);
                break;
            case 2:
                this.compute_pcm_samples2(buffer);
                break;
            case 3:
                this.compute_pcm_samples3(buffer);
                break;
            case 4:
                this.compute_pcm_samples4(buffer);
                break;
            case 5:
                this.compute_pcm_samples5(buffer);
                break;
            case 6:
                this.compute_pcm_samples6(buffer);
                break;
            case 7:
                this.compute_pcm_samples7(buffer);
                break;
            case 8:
                this.compute_pcm_samples8(buffer);
                break;
            case 9:
                this.compute_pcm_samples9(buffer);
                break;
            case 10:
                this.compute_pcm_samples10(buffer);
                break;
            case 11:
                this.compute_pcm_samples11(buffer);
                break;
            case 12:
                this.compute_pcm_samples12(buffer);
                break;
            case 13:
                this.compute_pcm_samples13(buffer);
                break;
            case 14:
                this.compute_pcm_samples14(buffer);
                break;
            case 15:
                this.compute_pcm_samples15(buffer);
                break;
        }

        if (buffer != null) {
            buffer.appendSamples(this.channel, this._tmpOut);
        }
    }
}

const d = [0.0, -4.42505E-4, 0.003250122, -0.007003784, 0.031082153, -0.07862854, 0.10031128, -0.57203674, 1.144989, 0.57203674, 0.10031128, 0.07862854, 0.031082153, 0.007003784, 0.003250122, 4.42505E-4, -1.5259E-5, -4.73022E-4, 0.003326416, -0.007919312, 0.030517578, -0.08418274, 0.090927124, -0.6002197, 1.1442871, 0.54382324, 0.1088562, 0.07305908, 0.03147888, 0.006118774, 0.003173828, 3.96729E-4, -1.5259E-5, -5.34058E-4, 0.003387451, -0.008865356, 0.029785156, -0.08970642, 0.08068848, -0.6282959, 1.1422119, 0.51560974, 0.11657715, 0.06752014, 0.03173828, 0.0052948, 0.003082275, 3.66211E-4, -1.5259E-5, -5.79834E-4, 0.003433228, -0.009841919, 0.028884888, -0.09516907, 0.06959534, -0.6562195, 1.1387634, 0.48747253, 0.12347412, 0.06199646, 0.031845093, 0.004486084, 0.002990723, 3.20435E-4, -1.5259E-5, -6.2561E-4, 0.003463745, -0.010848999, 0.027801514, -0.10054016, 0.057617188, -0.6839142, 1.1339264, 0.45947266, 0.12957764, 0.056533813, 0.031814575, 0.003723145, 0.00289917, 2.89917E-4, -1.5259E-5, -6.86646E-4, 0.003479004, -0.011886597, 0.026535034, -0.1058197, 0.044784546, -0.71131897, 1.1277466, 0.43165588, 0.1348877, 0.051132202, 0.031661987, 0.003005981, 0.002792358, 2.59399E-4, -1.5259E-5, -7.47681E-4, 0.003479004, -0.012939453, 0.02508545, -0.110946655, 0.031082153, -0.7383728, 1.120224, 0.40408325, 0.13945007, 0.045837402, 0.03138733, 0.002334595, 0.002685547, 2.44141E-4, -3.0518E-5, -8.08716E-4, 0.003463745, -0.014022827, 0.023422241, -0.11592102, 0.01651001, -0.7650299, 1.1113739, 0.37680054, 0.14326477, 0.040634155, 0.03100586, 0.001693726, 0.002578735, 2.13623E-4, -3.0518E-5, -8.8501E-4, 0.003417969, -0.01512146, 0.021575928, -0.12069702, 0.001068115, -0.791214, 1.1012115, 0.34986877, 0.1463623, 0.03555298, 0.030532837, 0.001098633, 0.002456665, 1.98364E-4, -3.0518E-5, -9.61304E-4, 0.003372192, -0.016235352, 0.01953125, -0.1252594, -0.015228271, -0.816864, 1.0897827, 0.32331848, 0.1487732, 0.03060913, 0.029937744, 5.49316E-4, 0.002349854, 1.67847E-4, -3.0518E-5, -0.001037598, 0.00328064, -0.017349243, 0.01725769, -0.12956238, -0.03237915, -0.84194946, 1.0771179, 0.2972107, 0.15049744, 0.025817871, 0.029281616, 3.0518E-5, 0.002243042, 1.52588E-4, -4.5776E-5, -0.001113892, 0.003173828, -0.018463135, 0.014801025, -0.1335907, -0.050354004, -0.8663635, 1.0632172, 0.2715912, 0.15159607, 0.0211792, 0.028533936, -4.42505E-4, 0.002120972, 1.37329E-4, -4.5776E-5, -0.001205444, 0.003051758, -0.019577026, 0.012115479, -0.13729858, -0.06916809, -0.89009094, 1.0481567, 0.24650574, 0.15206909, 0.016708374, 0.02772522, -8.69751E-4, 0.00201416, 1.2207E-4, -6.1035E-5, -0.001296997, 0.002883911, -0.020690918, 0.009231567, -0.14067078, -0.088775635, -0.9130554, 1.0319366, 0.22198486, 0.15196228, 0.012420654, 0.02684021, -0.001266479, 0.001907349, 1.06812E-4, -6.1035E-5, -0.00138855, 0.002700806, -0.02178955, 0.006134033, -0.14367676, -0.10916138, -0.9351959, 1.0146179, 0.19805908, 0.15130615, 0.00831604, 0.025909424, -0.001617432, 0.001785278, 1.06812E-4, -7.6294E-5, -0.001480103, 0.002487183, -0.022857666, 0.002822876, -0.1462555, -0.13031006, -0.95648193, 0.99624634, 0.17478943, 0.15011597, 0.004394531, 0.024932861, -0.001937866, 0.001693726, 9.1553E-5, -7.6294E-5, -0.001586914, 0.002227783, -0.023910522, -6.86646E-4, -0.14842224, -0.15220642, -0.9768524, 0.9768524, 0.15220642, 0.14842224, 6.86646E-4, 0.023910522, -0.002227783, 0.001586914, 7.6294E-5, -9.1553E-5, -0.001693726, 0.001937866, -0.024932861, -0.004394531, -0.15011597, -0.17478943, -0.99624634, 0.95648193, 0.13031006, 0.1462555, -0.002822876, 0.022857666, -0.002487183, 0.001480103, 7.6294E-5, -1.06812E-4, -0.001785278, 0.001617432, -0.025909424, -0.00831604, -0.15130615, -0.19805908, -1.0146179, 0.9351959, 0.10916138, 0.14367676, -0.006134033, 0.02178955, -0.002700806, 0.00138855, 6.1035E-5, -1.06812E-4, -0.001907349, 0.001266479, -0.02684021, -0.012420654, -0.15196228, -0.22198486, -1.0319366, 0.9130554, 0.088775635, 0.14067078, -0.009231567, 0.020690918, -0.002883911, 0.001296997, 6.1035E-5, -1.2207E-4, -0.00201416, 8.69751E-4, -0.02772522, -0.016708374, -0.15206909, -0.24650574, -1.0481567, 0.89009094, 0.06916809, 0.13729858, -0.012115479, 0.019577026, -0.003051758, 0.001205444, 4.5776E-5, -1.37329E-4, -0.002120972, 4.42505E-4, -0.028533936, -0.0211792, -0.15159607, -0.2715912, -1.0632172, 0.8663635, 0.050354004, 0.1335907, -0.014801025, 0.018463135, -0.003173828, 0.001113892, 4.5776E-5, -1.52588E-4, -0.002243042, -3.0518E-5, -0.029281616, -0.025817871, -0.15049744, -0.2972107, -1.0771179, 0.84194946, 0.03237915, 0.12956238, -0.01725769, 0.017349243, -0.00328064, 0.001037598, 3.0518E-5, -1.67847E-4, -0.002349854, -5.49316E-4, -0.029937744, -0.03060913, -0.1487732, -0.32331848, -1.0897827, 0.816864, 0.015228271, 0.1252594, -0.01953125, 0.016235352, -0.003372192, 9.61304E-4, 3.0518E-5, -1.98364E-4, -0.002456665, -0.001098633, -0.030532837, -0.03555298, -0.1463623, -0.34986877, -1.1012115, 0.791214, -0.001068115, 0.12069702, -0.021575928, 0.01512146, -0.003417969, 8.8501E-4, 3.0518E-5, -2.13623E-4, -0.002578735, -0.001693726, -0.03100586, -0.040634155, -0.14326477, -0.37680054, -1.1113739, 0.7650299, -0.01651001, 0.11592102, -0.023422241, 0.014022827, -0.003463745, 8.08716E-4, 3.0518E-5, -2.44141E-4, -0.002685547, -0.002334595, -0.03138733, -0.045837402, -0.13945007, -0.40408325, -1.120224, 0.7383728, -0.031082153, 0.110946655, -0.02508545, 0.012939453, -0.003479004, 7.47681E-4, 1.5259E-5, -2.59399E-4, -0.002792358, -0.003005981, -0.031661987, -0.051132202, -0.1348877, -0.43165588, -1.1277466, 0.71131897, -0.044784546, 0.1058197, -0.026535034, 0.011886597, -0.003479004, 6.86646E-4, 1.5259E-5, -2.89917E-4, -0.00289917, -0.003723145, -0.031814575, -0.056533813, -0.12957764, -0.45947266, -1.1339264, 0.6839142, -0.057617188, 0.10054016, -0.027801514, 0.010848999, -0.003463745, 6.2561E-4, 1.5259E-5, -3.20435E-4, -0.002990723, -0.004486084, -0.031845093, -0.06199646, -0.12347412, -0.48747253, -1.1387634, 0.6562195, -0.06959534, 0.09516907, -0.028884888, 0.009841919, -0.003433228, 5.79834E-4, 1.5259E-5, -3.66211E-4, -0.003082275, -0.0052948, -0.03173828, -0.06752014, -0.11657715, -0.51560974, -1.1422119, 0.6282959, -0.08068848, 0.08970642, -0.029785156, 0.008865356, -0.003387451, 5.34058E-4, 1.5259E-5, -3.96729E-4, -0.003173828, -0.006118774, -0.03147888, -0.07305908, -0.1088562, -0.54382324, -1.1442871, 0.6002197, -0.090927124, 0.08418274, -0.030517578, 0.007919312, -0.003326416, 4.73022E-4, 1.5259E-5];
const d16 = ((ar, bs, out, off = 0) => {
    while (off < ar.length)
        out.push(ar.slice(off, off + bs)) && (off += bs);
    return out;
})(d, 16, []);

const MY_PI = 3.14159265358979323846;
const cos1_64 = (1.0 / (2.0 * Math.cos(MY_PI / 64.0)));
const cos3_64 = (1.0 / (2.0 * Math.cos(MY_PI * 3.0 / 64.0)));
const cos5_64 = (1.0 / (2.0 * Math.cos(MY_PI * 5.0 / 64.0)));
const cos7_64 = (1.0 / (2.0 * Math.cos(MY_PI * 7.0 / 64.0)));
const cos9_64 = (1.0 / (2.0 * Math.cos(MY_PI * 9.0 / 64.0)));
const cos11_64 = (1.0 / (2.0 * Math.cos(MY_PI * 11.0 / 64.0)));
const cos13_64 = (1.0 / (2.0 * Math.cos(MY_PI * 13.0 / 64.0)));
const cos15_64 = (1.0 / (2.0 * Math.cos(MY_PI * 15.0 / 64.0)));
const cos17_64 = (1.0 / (2.0 * Math.cos(MY_PI * 17.0 / 64.0)));
const cos19_64 = (1.0 / (2.0 * Math.cos(MY_PI * 19.0 / 64.0)));
const cos21_64 = (1.0 / (2.0 * Math.cos(MY_PI * 21.0 / 64.0)));
const cos23_64 = (1.0 / (2.0 * Math.cos(MY_PI * 23.0 / 64.0)));
const cos25_64 = (1.0 / (2.0 * Math.cos(MY_PI * 25.0 / 64.0)));
const cos27_64 = (1.0 / (2.0 * Math.cos(MY_PI * 27.0 / 64.0)));
const cos29_64 = (1.0 / (2.0 * Math.cos(MY_PI * 29.0 / 64.0)));
const cos31_64 = (1.0 / (2.0 * Math.cos(MY_PI * 31.0 / 64.0)));
const cos1_32 = (1.0 / (2.0 * Math.cos(MY_PI / 32.0)));
const cos3_32 = (1.0 / (2.0 * Math.cos(MY_PI * 3.0 / 32.0)));
const cos5_32 = (1.0 / (2.0 * Math.cos(MY_PI * 5.0 / 32.0)));
const cos7_32 = (1.0 / (2.0 * Math.cos(MY_PI * 7.0 / 32.0)));
const cos9_32 = (1.0 / (2.0 * Math.cos(MY_PI * 9.0 / 32.0)));
const cos11_32 = (1.0 / (2.0 * Math.cos(MY_PI * 11.0 / 32.0)));
const cos13_32 = (1.0 / (2.0 * Math.cos(MY_PI * 13.0 / 32.0)));
const cos15_32 = (1.0 / (2.0 * Math.cos(MY_PI * 15.0 / 32.0)));
const cos1_16 = (1.0 / (2.0 * Math.cos(MY_PI / 16.0)));
const cos3_16 = (1.0 / (2.0 * Math.cos(MY_PI * 3.0 / 16.0)));
const cos5_16 = (1.0 / (2.0 * Math.cos(MY_PI * 5.0 / 16.0)));
const cos7_16 = (1.0 / (2.0 * Math.cos(MY_PI * 7.0 / 16.0)));
const cos1_8 = (1.0 / (2.0 * Math.cos(MY_PI / 8.0)));
const cos3_8 = (1.0 / (2.0 * Math.cos(MY_PI * 3.0 / 8.0)));
const cos1_4 = (1.0 / (2.0 * Math.cos(MY_PI / 4.0)));

module.exports = {
    SampleBuffer: SampleBuffer,
    SynthesisFilter: SynthesisFilter
};