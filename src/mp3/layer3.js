const huffcodetab = require('./huffcodetab');
const BitReserve = require('./bitreserve');
const BitStream = require('../bitstream');
const debug = require('debug')('mp3:layer3');

module.exports = class Layer3 {

    constructor(header0, filtera, filterb, buffer0) {

        this.CheckSumHuff = 0;
        this.part2_start = null;

        this.x = [0];
        this.y = [0];
        this.v = [0];
        this.w = [0];

        this.is_pos = (new Array(576)).fill(0);
        this.is_ratio = (new Array(576)).fill(0);

        this.samples1 = (new Array(32)).fill(0);
        this.samples2 = (new Array(32)).fill(0);

        this.tsOutCopy = (new Array(18)).fill(0);
        this.rawout = (new Array(36)).fill(0.0);

        huffcodetab.inithuff();
        this.is_1d = new Array(SBLIMIT * SSLIMIT + 4).fill(0);
        this.ro = (new Array(2)).fill().map(() => {
            return (new Array(SBLIMIT)).fill().map(() => {
                return (new Array(SSLIMIT)).fill(0)
            })
        });
        this.lr = (new Array(2)).fill().map(() => {
            return (new Array(SBLIMIT)).fill().map(() => {
                return (new Array(SSLIMIT)).fill(0)
            })
        });
        this.out_1d = (new Array(SBLIMIT * SSLIMIT)).fill(0);
        this.prevblck = (new Array(2)).fill().map(() => {
            return (new Array(SBLIMIT * SSLIMIT)).fill(0)
        });
        this.k = (new Array(2)).fill().map(() => {
            return (new Array(SBLIMIT * SSLIMIT)).fill(0)
        });
        this.nonzero = (new Array(2)).fill(576);

        this.scalefac = [new temporaire2(), new temporaire2()];

        this.sfBandIndex = new Array(9);
        // SZD: MPEG2.5 +3 indices
        const l0 = [0, 6, 12, 18, 24, 30, 36, 44, 54, 66, 80, 96, 116, 140, 168, 200, 238, 284, 336, 396, 464, 522, 576];
        const s0 = [0, 4, 8, 12, 18, 24, 32, 42, 56, 74, 100, 132, 174, 192];
        const l1 = [0, 6, 12, 18, 24, 30, 36, 44, 54, 66, 80, 96, 114, 136, 162, 194, 232, 278, 330, 394, 464, 540, 576];
        const s1 = [0, 4, 8, 12, 18, 26, 36, 48, 62, 80, 104, 136, 180, 192];
        const l2 = [0, 6, 12, 18, 24, 30, 36, 44, 54, 66, 80, 96, 116, 140, 168, 200, 238, 284, 336, 396, 464, 522, 576];
        const s2 = [0, 4, 8, 12, 18, 26, 36, 48, 62, 80, 104, 134, 174, 192];

        const l3 = [0, 4, 8, 12, 16, 20, 24, 30, 36, 44, 52, 62, 74, 90, 110, 134, 162, 196, 238, 288, 342, 418, 576];
        const s3 = [0, 4, 8, 12, 16, 22, 30, 40, 52, 66, 84, 106, 136, 192];
        const l4 = [0, 4, 8, 12, 16, 20, 24, 30, 36, 42, 50, 60, 72, 88, 106, 128, 156, 190, 230, 276, 330, 384, 576];
        const s4 = [0, 4, 8, 12, 16, 22, 28, 38, 50, 64, 80, 100, 126, 192];
        const l5 = [0, 4, 8, 12, 16, 20, 24, 30, 36, 44, 54, 66, 82, 102, 126, 156, 194, 240, 296, 364, 448, 550, 576];
        const s5 = [0, 4, 8, 12, 16, 22, 30, 42, 58, 78, 104, 138, 180, 192];
        // SZD: MPEG2.5
        const l6 = [0, 6, 12, 18, 24, 30, 36, 44, 54, 66, 80, 96, 116, 140, 168, 200, 238, 284, 336, 396, 464, 522, 576];
        const s6 = [0, 4, 8, 12, 18, 26, 36, 48, 62, 80, 104, 134, 174, 192];
        const l7 = [0, 6, 12, 18, 24, 30, 36, 44, 54, 66, 80, 96, 116, 140, 168, 200, 238, 284, 336, 396, 464, 522, 576];
        const s7 = [0, 4, 8, 12, 18, 26, 36, 48, 62, 80, 104, 134, 174, 192];
        const l8 = [0, 12, 24, 36, 48, 60, 72, 88, 108, 132, 160, 192, 232, 280, 336, 400, 476, 566, 568, 570, 572, 574, 576];
        const s8 = [0, 8, 16, 24, 36, 52, 72, 96, 124, 160, 162, 164, 166, 192];

        this.sfBandIndex[0] = new SBI(l0, s0);
        this.sfBandIndex[1] = new SBI(l1, s1);
        this.sfBandIndex[2] = new SBI(l2, s2);

        this.sfBandIndex[3] = new SBI(l3, s3);
        this.sfBandIndex[4] = new SBI(l4, s4);
        this.sfBandIndex[5] = new SBI(l5, s5);
        //SZD: MPEG2.5
        this.sfBandIndex[6] = new SBI(l6, s6);
        this.sfBandIndex[7] = new SBI(l7, s7);
        this.sfBandIndex[8] = new SBI(l8, s8);
        // END OF L3TABLE INIT

        if (null === reorder_table) {
            reorder_table = new Array(9);
            for (let i = 0; i < 9; i++)
                reorder_table[i] = reorder(this.sfBandIndex[i].s);
        }

        this.filter1 = filtera;
        this.filter2 = filterb;
        this.buffer = buffer0;

        this.frame_start = 0;
        this.channels = (header0.mode === header0.SINGLE_CHANNEL) ? 1 : 2;
        this.max_gr = (header0.version === header0.MPEG1) ? 2 : 1;

        this.sfreq = header0.freq +
            ((header0.version === header0.MPEG1) ? 3 :
                (header0.version === header0.MPEG25_LSF) ? 6 : 0);

        this.br = new BitReserve();
        this.si = new III_side_info_t();
    }

    decodeFrame(header, data) {
        let nSlots = header.slots();
        let flush_main;
        let gr, ch, ss, sb, sb18;
        let main_data_end;
        let bytes_to_discard;
        let i;

        const bitStream = new BitStream(data);

        this.get_side_info(header, bitStream);

        for (i = 0; i < nSlots; i++)
            this.br.hputbuf(bitStream.readBits(8));

        main_data_end = this.br.hsstell() >>> 3; // of previous frame // fixme

        if ((flush_main = (this.br.hsstell() & 7)) !== 0) {
            this.br.hgetbits(8 - flush_main);
            main_data_end++;
        }

        bytes_to_discard = this.frame_start - main_data_end
            - this.si.main_data_begin;

        this.frame_start += nSlots;

        if (bytes_to_discard < 0)
            return;

        if (main_data_end > 4096) {
            this.frame_start -= 4096;
            this.br.rewindNbytes(4096);
        }

        for (; bytes_to_discard > 0; bytes_to_discard--)
            this.br.hgetbits(8);

        for (gr = 0; gr < this.max_gr; gr++) {
            for (ch = 0; ch < this.channels; ch++) {
                this.part2_start = this.br.hsstell();

                if (header.version === header.MPEG1)
                    this.get_scale_factors(ch, gr);
                else {
                    throw 'not implemented';
                }

                this.huffman_decode(ch, gr);

                this.dequantize_sample(this.ro[ch], ch, gr);
            }

            this.stereo(header, gr);

            // shortcuts
            const lr = this.lr;

            for (ch = 0; ch < this.channels; ch++) {

                this.reorder(lr[ch], ch, gr);
                this.antialias(ch, gr);
                this.hybrid(ch, gr);

                for (sb18 = 18; sb18 < 576; sb18 += 36) // Frequency inversion
                    for (ss = 1; ss < SSLIMIT; ss += 2)
                        this.out_1d[sb18 + ss] = -this.out_1d[sb18 + ss];

                if (ch === 0) {
                    for (ss = 0; ss < SSLIMIT; ss++) { // Polyphase synthesis
                        sb = 0;
                        for (sb18 = 0; sb18 < 576; sb18 += 18) {
                            this.samples1[sb] = this.out_1d[sb18 + ss];
                            sb++;
                        }
                        this.filter1.input_samples(this.samples1);
                        this.filter1.calculate_pcm_samples(this.buffer);
                    }
                } else {
                    for (ss = 0; ss < SSLIMIT; ss++) { // Polyphase synthesis
                        sb = 0;
                        for (sb18 = 0; sb18 < 576; sb18 += 18) {
                            this.samples2[sb] = this.out_1d[sb18 + ss];
                            sb++;
                        }
                        this.filter2.input_samples(this.samples2);
                        this.filter2.calculate_pcm_samples(this.buffer);
                    }

                }
            } // channels
        }
    }

    get_side_info(header, bitStream) {
        let ch, gr;

        if (header.version === header.MPEG1) {
            this.si.main_data_begin = bitStream.readBits(9);

            if (this.channels === 1)
                this.si.private_bits = bitStream.readBits(5);
            else
                this.si.private_bits = bitStream.readBits(3);

            for (ch = 0; ch < this.channels; ch++) {
                this.si.ch[ch].scfsi[0] = bitStream.readBits(1);
                this.si.ch[ch].scfsi[1] = bitStream.readBits(1);
                this.si.ch[ch].scfsi[2] = bitStream.readBits(1);
                this.si.ch[ch].scfsi[3] = bitStream.readBits(1);
            }

            for (gr = 0; gr < 2; gr++) {
                for (ch = 0; ch < this.channels; ch++) {
                    this.si.ch[ch].gr[gr].part2_3_length = bitStream.readBits(12);
                    this.si.ch[ch].gr[gr].big_values = bitStream.readBits(9);
                    this.si.ch[ch].gr[gr].global_gain = bitStream.readBits(8);
                    this.si.ch[ch].gr[gr].scalefac_compress = bitStream.readBits(4);
                    this.si.ch[ch].gr[gr].window_switching_flag = bitStream.readBits(1);

                    if ((this.si.ch[ch].gr[gr].window_switching_flag) !== 0) {
                        this.si.ch[ch].gr[gr].block_type = bitStream.readBits(2);
                        this.si.ch[ch].gr[gr].mixed_block_flag = bitStream.readBits(1);

                        this.si.ch[ch].gr[gr].table_select[0] = bitStream.readBits(5);
                        this.si.ch[ch].gr[gr].table_select[1] = bitStream.readBits(5);

                        this.si.ch[ch].gr[gr].subblock_gain[0] = bitStream.readBits(3);
                        this.si.ch[ch].gr[gr].subblock_gain[1] = bitStream.readBits(3);
                        this.si.ch[ch].gr[gr].subblock_gain[2] = bitStream.readBits(3);

                        // Set region_count parameters since they are implicit inp this case.

                        if (this.si.ch[ch].gr[gr].block_type === 0) { // Side info bad: block_type == 0 inp split block
                            return false;
                        } else if (this.si.ch[ch].gr[gr].block_type === 2 && this.si.ch[ch].gr[gr].mixed_block_flag === 0) {
                            this.si.ch[ch].gr[gr].region0_count = 8;
                        } else {
                            this.si.ch[ch].gr[gr].region0_count = 7;
                        }

                        this.si.ch[ch].gr[gr].region1_count = 20 -
                            this.si.ch[ch].gr[gr].region0_count;
                    } else {
                        this.si.ch[ch].gr[gr].table_select[0] = bitStream.readBits(5);
                        this.si.ch[ch].gr[gr].table_select[1] = bitStream.readBits(5);
                        this.si.ch[ch].gr[gr].table_select[2] = bitStream.readBits(5);
                        this.si.ch[ch].gr[gr].region0_count = bitStream.readBits(4);
                        this.si.ch[ch].gr[gr].region1_count = bitStream.readBits(3);
                        this.si.ch[ch].gr[gr].block_type = 0;
                    }

                    this.si.ch[ch].gr[gr].preflag = bitStream.readBits(1);
                    this.si.ch[ch].gr[gr].scalefac_scale = bitStream.readBits(1);
                    this.si.ch[ch].gr[gr].count1table_select = bitStream.readBits(1);
                }
            }
        } else {
            throw 'not implemented';
        }

        return true;
    }

    get_scale_factors(ch, gr) {
        let gr_info = this.si.ch[ch].gr[gr];
        let scale_comp = gr_info.scalefac_compress;
        let length0 = slen[0][scale_comp];
        let length1 = slen[1][scale_comp];

        if ((gr_info.window_switching_flag !== 0) && (gr_info.block_type === 2)) {
            if ((gr_info.mixed_block_flag) !== 0) { // MIXED

                throw 'not implemented';

            } else {  // SHORT
                this.scalefac[ch].s[0][0] = this.br.hgetbits(length0);
                this.scalefac[ch].s[1][0] = this.br.hgetbits(length0);
                this.scalefac[ch].s[2][0] = this.br.hgetbits(length0);
                this.scalefac[ch].s[0][1] = this.br.hgetbits(length0);
                this.scalefac[ch].s[1][1] = this.br.hgetbits(length0);
                this.scalefac[ch].s[2][1] = this.br.hgetbits(length0);
                this.scalefac[ch].s[0][2] = this.br.hgetbits(length0);
                this.scalefac[ch].s[1][2] = this.br.hgetbits(length0);
                this.scalefac[ch].s[2][2] = this.br.hgetbits(length0);
                this.scalefac[ch].s[0][3] = this.br.hgetbits(length0);
                this.scalefac[ch].s[1][3] = this.br.hgetbits(length0);
                this.scalefac[ch].s[2][3] = this.br.hgetbits(length0);
                this.scalefac[ch].s[0][4] = this.br.hgetbits(length0);
                this.scalefac[ch].s[1][4] = this.br.hgetbits(length0);
                this.scalefac[ch].s[2][4] = this.br.hgetbits(length0);
                this.scalefac[ch].s[0][5] = this.br.hgetbits(length0);
                this.scalefac[ch].s[1][5] = this.br.hgetbits(length0);
                this.scalefac[ch].s[2][5] = this.br.hgetbits(length0);
                this.scalefac[ch].s[0][6] = this.br.hgetbits(length1);
                this.scalefac[ch].s[1][6] = this.br.hgetbits(length1);
                this.scalefac[ch].s[2][6] = this.br.hgetbits(length1);
                this.scalefac[ch].s[0][7] = this.br.hgetbits(length1);
                this.scalefac[ch].s[1][7] = this.br.hgetbits(length1);
                this.scalefac[ch].s[2][7] = this.br.hgetbits(length1);
                this.scalefac[ch].s[0][8] = this.br.hgetbits(length1);
                this.scalefac[ch].s[1][8] = this.br.hgetbits(length1);
                this.scalefac[ch].s[2][8] = this.br.hgetbits(length1);
                this.scalefac[ch].s[0][9] = this.br.hgetbits(length1);
                this.scalefac[ch].s[1][9] = this.br.hgetbits(length1);
                this.scalefac[ch].s[2][9] = this.br.hgetbits(length1);
                this.scalefac[ch].s[0][10] = this.br.hgetbits(length1);
                this.scalefac[ch].s[1][10] = this.br.hgetbits(length1);
                this.scalefac[ch].s[2][10] = this.br.hgetbits(length1);
                this.scalefac[ch].s[0][11] = this.br.hgetbits(length1);
                this.scalefac[ch].s[1][11] = this.br.hgetbits(length1);
                this.scalefac[ch].s[2][11] = this.br.hgetbits(length1);
                this.scalefac[ch].s[0][12] = 0;
                this.scalefac[ch].s[1][12] = 0;
                this.scalefac[ch].s[2][12] = 0;
            } // SHORT
        } else {   // LONG types 0,1,3
            if ((this.si.ch[ch].scfsi[0] === 0) || (gr === 0)) {
                this.scalefac[ch].l[0] = this.br.hgetbits(length0);
                this.scalefac[ch].l[1] = this.br.hgetbits(length0);
                this.scalefac[ch].l[2] = this.br.hgetbits(length0);
                this.scalefac[ch].l[3] = this.br.hgetbits(length0);
                this.scalefac[ch].l[4] = this.br.hgetbits(length0);
                this.scalefac[ch].l[5] = this.br.hgetbits(length0);
            }
            if ((this.si.ch[ch].scfsi[1] === 0) || (gr === 0)) {
                this.scalefac[ch].l[6] = this.br.hgetbits(length0);
                this.scalefac[ch].l[7] = this.br.hgetbits(length0);
                this.scalefac[ch].l[8] = this.br.hgetbits(length0);
                this.scalefac[ch].l[9] = this.br.hgetbits(length0);
                this.scalefac[ch].l[10] = this.br.hgetbits(length0);
            }
            if ((this.si.ch[ch].scfsi[2] === 0) || (gr === 0)) {
                this.scalefac[ch].l[11] = this.br.hgetbits(length1);
                this.scalefac[ch].l[12] = this.br.hgetbits(length1);
                this.scalefac[ch].l[13] = this.br.hgetbits(length1);
                this.scalefac[ch].l[14] = this.br.hgetbits(length1);
                this.scalefac[ch].l[15] = this.br.hgetbits(length1);
            }
            if ((this.si.ch[ch].scfsi[3] === 0) || (gr === 0)) {
                this.scalefac[ch].l[16] = this.br.hgetbits(length1);
                this.scalefac[ch].l[17] = this.br.hgetbits(length1);
                this.scalefac[ch].l[18] = this.br.hgetbits(length1);
                this.scalefac[ch].l[19] = this.br.hgetbits(length1);
                this.scalefac[ch].l[20] = this.br.hgetbits(length1);
            }

            this.scalefac[ch].l[21] = 0;
            this.scalefac[ch].l[22] = 0;
        }
    }

    huffman_decode(ch, gr) {
        const x = this.x, y = this.y, v = this.v, w = this.w, si = this.si;

        x[0] = 0;
        y[0] = 0;
        v[0] = 0;
        w[0] = 0;

        let part2_3_end = this.part2_start + si.ch[ch].gr[gr].part2_3_length;
        let num_bits, region1Start, region2Start;
        let index, buf, buf1, h;

        // Find region boundary for short block case

        if (((si.ch[ch].gr[gr].window_switching_flag) !== 0) && (si.ch[ch].gr[gr].block_type === 2)) {
            // Region2.
            // MS: Extrahandling for 8KHZ
            region1Start = (this.sfreq === 8) ? 72 : 36;    // sfb[9/3]*3=36 or inp case 8KHZ = 72
            region2Start = 576;                             // No Region2 for short block case
        } else {
            // Find region boundary for long block case
            buf = si.ch[ch].gr[gr].region0_count + 1;
            buf1 = buf + si.ch[ch].gr[gr].region1_count + 1;

            if (buf1 > this.sfBandIndex[this.sfreq].l.length - 1)
                buf1 = this.sfBandIndex[this.sfreq].l.length - 1;

            region1Start = this.sfBandIndex[this.sfreq].l[buf];
            region2Start = this.sfBandIndex[this.sfreq].l[buf1];
        }

        index = 0;

        // Read bigvalues area
        for (let i = 0; i < (si.ch[ch].gr[gr].big_values << 1); i += 2) {
            if (i < region1Start) h = huffcodetab.ht[si.ch[ch].gr[gr].table_select[0]];
            else if (i < region2Start) h = huffcodetab.ht[si.ch[ch].gr[gr].table_select[1]];
            else h = huffcodetab.ht[si.ch[ch].gr[gr].table_select[2]];

            huffcodetab.huffman_decoder(h, x, y, v, w, this.br);

            this.is_1d[index++] = x[0];
            this.is_1d[index++] = y[0];

            this.CheckSumHuff = this.CheckSumHuff + x[0] + y[0];
        }

        // Read count1 area
        h = huffcodetab.ht[si.ch[ch].gr[gr].count1table_select + 32];
        num_bits = this.br.hsstell();

        while ((num_bits < part2_3_end) && (index < 576)) {
            huffcodetab.huffman_decoder(h, x, y, v, w, this.br);

            this.is_1d[index++] = v[0];
            this.is_1d[index++] = w[0];
            this.is_1d[index++] = x[0];
            this.is_1d[index++] = y[0];

            this.CheckSumHuff = this.CheckSumHuff + v[0] + w[0] + x[0] + y[0];
            num_bits = this.br.hsstell();
        }

        if (num_bits > part2_3_end) {
            this.br.rewindNbits(num_bits - part2_3_end);
            index -= 4;
        }

        num_bits = this.br.hsstell();

        // Dismiss stuffing bits
        if (num_bits < part2_3_end)
            this.br.hgetbits(part2_3_end - num_bits);

        // Zero out rest

        if (index < 576)
            this.nonzero[ch] = index;
        else
            this.nonzero[ch] = 576;

        if (index < 0) index = 0;

        // may not be necessary
        for (; index < 576; index++)
            this.is_1d[index] = 0;
    }

    dequantize_sample(xr, ch, gr) {
        const xr_1d = xr;
        const gr_info = this.si.ch[ch].gr[gr];

        let cb = 0, cb_begin = 0, cb_width = 0, next_cb_boundary;
        let index = 0, t_index, j, g_gain;

        // choose correct scalefactor band per block type, initalize boundary
        if ((gr_info.window_switching_flag !== 0) && (gr_info.block_type === 2)) {
            if (gr_info.mixed_block_flag !== 0)
                next_cb_boundary = this.sfBandIndex[this.sfreq].l[1];  // LONG blocks: 0,1,3
            else {
                cb_width = this.sfBandIndex[this.sfreq].s[1];
                next_cb_boundary = (cb_width << 2) - cb_width;
                cb_begin = 0;
            }
        } else {
            next_cb_boundary = this.sfBandIndex[this.sfreq].l[1];  // LONG blocks: 0,1,3
        }

        // Compute overall (global) scaling.

        g_gain = Math.pow(2.0, (0.25 * (gr_info.global_gain - 210.0)));

        for (j = 0; j < this.nonzero[ch]; j++) {
            // Modif E.B 02/22/99
            let reste = j % SSLIMIT;
            let quotien = ((j - reste) / SSLIMIT);

            if (this.is_1d[j] === 0)
                xr_1d[quotien][reste] = 0.0;
            else {
                let abv = this.is_1d[j];
                // Pow Array fix (11/17/04)
                if (abv < t_43.length) {
                    if (this.is_1d[j] > 0)
                        xr_1d[quotien][reste] = g_gain * t_43[abv];
                    else {
                        if (-abv < t_43.length)
                            xr_1d[quotien][reste] = -g_gain * t_43[-abv];
                        else
                            xr_1d[quotien][reste] = -g_gain * Math.pow(-abv, d43);
                    }
                } else {
                    if (this.is_1d[j] > 0)
                        xr_1d[quotien][reste] = g_gain * Math.pow(abv, d43);
                    else
                        xr_1d[quotien][reste] = -g_gain * Math.pow(-abv, d43);
                }
            }
        }

        // apply formula per block type
        for (j = 0; j < this.nonzero[ch]; j++) {
            // Modif E.B 02/22/99
            let reste = j % SSLIMIT;
            let quotien = ((j - reste) / SSLIMIT);

            if (index === next_cb_boundary) { /* Adjust critical band boundary */
                if ((gr_info.window_switching_flag !== 0) && (gr_info.block_type === 2)) {
                    if (gr_info.mixed_block_flag !== 0) {

                        if (index === this.sfBandIndex[this.sfreq].l[8]) {
                            next_cb_boundary = this.sfBandIndex[this.sfreq].s[4];
                            next_cb_boundary = (next_cb_boundary << 2) -
                                next_cb_boundary;
                            cb = 3;
                            cb_width = this.sfBandIndex[this.sfreq].s[4] -
                                this.sfBandIndex[this.sfreq].s[3];

                            cb_begin = this.sfBandIndex[this.sfreq].s[3];
                            cb_begin = (cb_begin << 2) - cb_begin;

                        } else if (index < this.sfBandIndex[this.sfreq].l[8]) {

                            next_cb_boundary = this.sfBandIndex[this.sfreq].l[(++cb) + 1];

                        } else {

                            next_cb_boundary = this.sfBandIndex[this.sfreq].s[(++cb) + 1];
                            next_cb_boundary = (next_cb_boundary << 2) -
                                next_cb_boundary;

                            cb_begin = this.sfBandIndex[this.sfreq].s[cb];
                            cb_width = this.sfBandIndex[this.sfreq].s[cb + 1] -
                                cb_begin;
                            cb_begin = (cb_begin << 2) - cb_begin;
                        }

                    } else {

                        next_cb_boundary = this.sfBandIndex[this.sfreq].s[(++cb) + 1];
                        next_cb_boundary = (next_cb_boundary << 2) -
                            next_cb_boundary;

                        cb_begin = this.sfBandIndex[this.sfreq].s[cb];
                        cb_width = this.sfBandIndex[this.sfreq].s[cb + 1] -
                            cb_begin;
                        cb_begin = (cb_begin << 2) - cb_begin;
                    }

                } else { // long blocks
                    next_cb_boundary = this.sfBandIndex[this.sfreq].l[(++cb) + 1];
                }
            }

            // Do long/short dependent scaling operations

            if ((gr_info.window_switching_flag !== 0) &&
                (((gr_info.block_type === 2) && (gr_info.mixed_block_flag === 0)) ||
                    ((gr_info.block_type === 2) && (gr_info.mixed_block_flag !== 0) && (j >= 36)))) {

                t_index = ((index - cb_begin) / cb_width) ^ 0;

                let idx = this.scalefac[ch].s[t_index][cb] << gr_info.scalefac_scale;
                idx += (gr_info.subblock_gain[t_index] << 2);

                xr_1d[quotien][reste] *= two_to_negative_half_pow[idx];

            } else {   // LONG block types 0,1,3 & 1st 2 subbands of switched blocks

                let idx = this.scalefac[ch].l[cb];

                if (gr_info.preflag !== 0)
                    idx += pretab[cb];

                idx = idx << gr_info.scalefac_scale;
                xr_1d[quotien][reste] *= two_to_negative_half_pow[idx];
            }
            index++;
        }

        for (j = this.nonzero[ch]; j < 576; j++) {
            let reste = j % SSLIMIT;
            let quotien = ((j - reste) / SSLIMIT);

            if (reste < 0) reste = 0;
            if (quotien < 0) quotien = 0;

            xr_1d[quotien][reste] = 0.0;
        }
    }

    stereo(header, gr) {
        let sb, ss, i = 0;

        const lr = this.lr, ro = this.ro, si = this.si;
        const is_pos = this.is_pos, is_ratio = this.is_ratio;

        if (this.channels === 1)
            throw 'not implemented';

        const mode_ext = header.extension;

        // MS Stereo
        const ms_stereo     = ((header.mode === header.JOINT_STEREO) && ((mode_ext & 0x2) !== 0));
        // Intensity Stereo
        const i_stereo      = ((header.mode === header.JOINT_STEREO) && ((mode_ext & 0x1) !== 0));

        if (i_stereo)
            throw 'not implemented';

        // initialization
        is_pos.fill(7); is_ratio.fill(0.0);

        for (sb = 0; sb < SBLIMIT; sb++)
        for (ss = 0; ss < SSLIMIT; ss++) {
            if (is_pos[i] === 7) {
                if (ms_stereo) {
                    lr[0][sb][ss] = (ro[0][sb][ss] + ro[1][sb][ss]) * 0.707106781;
                    lr[1][sb][ss] = (ro[0][sb][ss] - ro[1][sb][ss]) * 0.707106781;
                } else {
                    lr[0][sb][ss] = ro[0][sb][ss];
                    lr[1][sb][ss] = ro[1][sb][ss];
                }
            }
            i++;
        }
    }

    reorder(xr, ch, gr) {
        let gr_info = this.si.ch[ch].gr[gr];
        let freq, freq3;
        let index;
        let sfb, sfb_start, sfb_lines;
        let src_line, des_line;
        const xr_1d = xr;

        const sfBandIndex = this.sfBandIndex, sfreq = this.sfreq;
        const out_1d = this.out_1d;


        if ((gr_info.window_switching_flag !== 0) && (gr_info.block_type === 2)) {
            for (index = 0; index < 576; index++)
                out_1d[index] = 0.0;

            if (gr_info.mixed_block_flag !== 0) {
                // NO REORDER FOR LOW 2 SUBBANDS
                for (index = 0; index < 36; index++) {
                    // Modif E.B 02/22/99
                    let reste = index % SSLIMIT;
                    let quotien = ((index - reste) / SSLIMIT);
                    out_1d[index] = xr_1d[quotien][reste];
                }

                // REORDERING FOR REST SWITCHED SHORT
                for (sfb = 3; sfb < 13; sfb++) {
                    sfb_start = sfBandIndex[sfreq].s[sfb];
                    sfb_lines = sfBandIndex[sfreq].s[sfb + 1] - sfb_start;

                    let sfb_start3 = (sfb_start << 2) - sfb_start;

                    for (freq = 0, freq3 = 0; freq < sfb_lines; freq++, freq3 += 3) {
                        src_line = sfb_start3 + freq;
                        des_line = sfb_start3 + freq3;
                        // Modif E.B 02/22/99
                        let reste = src_line % SSLIMIT;
                        let quotien = ((src_line - reste) / SSLIMIT);

                        out_1d[des_line] = xr_1d[quotien][reste];
                        src_line += sfb_lines;
                        des_line++;

                        reste = src_line % SSLIMIT;
                        quotien = ((src_line - reste) / SSLIMIT);

                        out_1d[des_line] = xr_1d[quotien][reste];
                        src_line += sfb_lines;
                        des_line++;

                        reste = src_line % SSLIMIT;
                        quotien = ((src_line - reste) / SSLIMIT);

                        out_1d[des_line] = xr_1d[quotien][reste];
                    }
                }
            } else {  // pure short
                for (index = 0; index < 576; index++) {
                    let j = reorder_table[sfreq][index];
                    let reste = j % SSLIMIT;
                    let quotien = ((j - reste) / SSLIMIT);
                    out_1d[index] = xr_1d[quotien][reste];
                }
            }
        }
        else {   // long blocks
            for (index = 0; index < 576; index++) {
                // Modif E.B 02/22/99
                let reste = index % SSLIMIT;
                let quotien = ((index - reste) / SSLIMIT);
                out_1d[index] = xr_1d[quotien][reste];
            }
        }
    }

    antialias(ch, gr) {
        let sb18, ss, sb18lim;
        let gr_info = this.si.ch[ch].gr[gr];

        // 31 alias-reduction operations between each pair of sub-bands
        // with 8 butterflies between each pair

        if ((gr_info.window_switching_flag !== 0) && (gr_info.block_type === 2) && !(gr_info.mixed_block_flag !== 0))
            return;

        if ((gr_info.window_switching_flag !== 0) && (gr_info.mixed_block_flag !== 0) && (gr_info.block_type === 2)) {
            sb18lim = 18;
        } else {
            sb18lim = 558;
        }

        const out_1d = this.out_1d;

        for (sb18 = 0; sb18 < sb18lim; sb18 += 18) {
            for (ss = 0; ss < 8; ss++) {
                let src_idx1 = sb18 + 17 - ss;
                let src_idx2 = sb18 + 18 + ss;
                let bu = out_1d[src_idx1];
                let bd = out_1d[src_idx2];
                out_1d[src_idx1] = (bu * cs[ss]) - (bd * ca[ss]);
                out_1d[src_idx2] = (bd * cs[ss]) + (bu * ca[ss]);
            }
        }
    }

    hybrid(ch, gr) {
        let bt;
        let sb18;
        let gr_info = (this.si.ch[ch].gr[gr]);
        let tsOut;

        const out_1d = this.out_1d;
        const tsOutCopy = this.tsOutCopy;

        for (sb18 = 0; sb18 < 576; sb18 += 18) {
            bt = ((gr_info.window_switching_flag !== 0) && (gr_info.mixed_block_flag !== 0) &&
                (sb18 < 36)) ? 0 : gr_info.block_type;

            tsOut = out_1d;
            // Modif E.B 02/22/99
            for (let cc = 0; cc < 18; cc++)
                tsOutCopy[cc] = tsOut[cc + sb18];

            this.inv_mdct(tsOutCopy, this.rawout, bt);

            for (let cc = 0; cc < 18; cc++)
                tsOut[cc + sb18] = tsOutCopy[cc];
            // Fin Modif

            // overlap addition
            const prvblk = this.prevblck;
            const rawout = this.rawout;

            tsOut[sb18] = rawout[0] + prvblk[ch][sb18];
            prvblk[ch][sb18] = rawout[18];
            tsOut[1 + sb18] = rawout[1] + prvblk[ch][sb18 + 1];
            prvblk[ch][sb18 + 1] = rawout[19];
            tsOut[2 + sb18] = rawout[2] + prvblk[ch][sb18 + 2];
            prvblk[ch][sb18 + 2] = rawout[20];
            tsOut[3 + sb18] = rawout[3] + prvblk[ch][sb18 + 3];
            prvblk[ch][sb18 + 3] = rawout[21];
            tsOut[4 + sb18] = rawout[4] + prvblk[ch][sb18 + 4];
            prvblk[ch][sb18 + 4] = rawout[22];
            tsOut[5 + sb18] = rawout[5] + prvblk[ch][sb18 + 5];
            prvblk[ch][sb18 + 5] = rawout[23];
            tsOut[6 + sb18] = rawout[6] + prvblk[ch][sb18 + 6];
            prvblk[ch][sb18 + 6] = rawout[24];
            tsOut[7 + sb18] = rawout[7] + prvblk[ch][sb18 + 7];
            prvblk[ch][sb18 + 7] = rawout[25];
            tsOut[8 + sb18] = rawout[8] + prvblk[ch][sb18 + 8];
            prvblk[ch][sb18 + 8] = rawout[26];
            tsOut[9 + sb18] = rawout[9] + prvblk[ch][sb18 + 9];
            prvblk[ch][sb18 + 9] = rawout[27];
            tsOut[10 + sb18] = rawout[10] + prvblk[ch][sb18 + 10];
            prvblk[ch][sb18 + 10] = rawout[28];
            tsOut[11 + sb18] = rawout[11] + prvblk[ch][sb18 + 11];
            prvblk[ch][sb18 + 11] = rawout[29];
            tsOut[12 + sb18] = rawout[12] + prvblk[ch][sb18 + 12];
            prvblk[ch][sb18 + 12] = rawout[30];
            tsOut[13 + sb18] = rawout[13] + prvblk[ch][sb18 + 13];
            prvblk[ch][sb18 + 13] = rawout[31];
            tsOut[14 + sb18] = rawout[14] + prvblk[ch][sb18 + 14];
            prvblk[ch][sb18 + 14] = rawout[32];
            tsOut[15 + sb18] = rawout[15] + prvblk[ch][sb18 + 15];
            prvblk[ch][sb18 + 15] = rawout[33];
            tsOut[16 + sb18] = rawout[16] + prvblk[ch][sb18 + 16];
            prvblk[ch][sb18 + 16] = rawout[34];
            tsOut[17 + sb18] = rawout[17] + prvblk[ch][sb18 + 17];
            prvblk[ch][sb18 + 17] = rawout[35];
        }
    }

    inv_mdct(inp, out, block_type) {
        let win_bt;
        let i;

        let tmpf_0, tmpf_1, tmpf_2, tmpf_3, tmpf_4, tmpf_5, tmpf_6, tmpf_7, tmpf_8, tmpf_9;
        let tmpf_10, tmpf_11, tmpf_12, tmpf_13, tmpf_14, tmpf_15, tmpf_16, tmpf_17;

        tmpf_0 = tmpf_1 = tmpf_2 = tmpf_3 = tmpf_4 = tmpf_5 = tmpf_6 = tmpf_7 = tmpf_8 = tmpf_9 =
            tmpf_10 = tmpf_11 = tmpf_12 = tmpf_13 = tmpf_14 = tmpf_15 = tmpf_16 = tmpf_17 = 0.0;

        if (block_type === 2) {

            out[0] = 0.0;
            out[1] = 0.0;
            out[2] = 0.0;
            out[3] = 0.0;
            out[4] = 0.0;
            out[5] = 0.0;
            out[6] = 0.0;
            out[7] = 0.0;
            out[8] = 0.0;
            out[9] = 0.0;
            out[10] = 0.0;
            out[11] = 0.0;
            out[12] = 0.0;
            out[13] = 0.0;
            out[14] = 0.0;
            out[15] = 0.0;
            out[16] = 0.0;
            out[17] = 0.0;
            out[18] = 0.0;
            out[19] = 0.0;
            out[20] = 0.0;
            out[21] = 0.0;
            out[22] = 0.0;
            out[23] = 0.0;
            out[24] = 0.0;
            out[25] = 0.0;
            out[26] = 0.0;
            out[27] = 0.0;
            out[28] = 0.0;
            out[29] = 0.0;
            out[30] = 0.0;
            out[31] = 0.0;
            out[32] = 0.0;
            out[33] = 0.0;
            out[34] = 0.0;
            out[35] = 0.0;

            let six_i = 0;

            for (i = 0; i < 3; i++) {
                // 12 point IMDCT
                // Begin 12 point IDCT
                // Input aliasing for 12 pt IDCT
                inp[15 + i] += inp[12 + i];
                inp[12 + i] += inp[9 + i];
                inp[9 + i] += inp[6 + i];
                inp[6 + i] += inp[3 + i];
                inp[3 + i] += inp[i];

                // Input aliasing on odd indices (for 6 point IDCT)
                inp[15 + i] += inp[9 + i];
                inp[9 + i] += inp[3 + i];

                // 3 point IDCT on even indices
                let pp1, pp2, sum;
                pp2 = inp[12 + i] * 0.500000000;
                pp1 = inp[6 + i] * 0.866025403;
                sum = inp[i] + pp2;
                tmpf_1 = inp[i] - inp [12 + i];
                tmpf_0 = sum + pp1;
                tmpf_2 = sum - pp1;

                // End 3 point IDCT on even indices
                // 3 point IDCT on odd indices (for 6 point IDCT)
                pp2 = inp[15 + i] * 0.500000000;
                pp1 = inp[9 + i] * 0.866025403;
                sum = inp[3 + i] + pp2;
                tmpf_4 = inp[3 + i] - inp [15 + i];
                tmpf_5 = sum + pp1;
                tmpf_3 = sum - pp1;
                // End 3 point IDCT on odd indices
                // Twiddle factors on odd indices (for 6 point IDCT)

                tmpf_3 *= 1.931851653;
                tmpf_4 *= 0.707106781;
                tmpf_5 *= 0.517638090;

                // Output butterflies on 2 3 point IDCT's (for 6 point IDCT)
                let save = tmpf_0;
                tmpf_0 += tmpf_5;
                tmpf_5 = save - tmpf_5;
                save = tmpf_1;
                tmpf_1 += tmpf_4;
                tmpf_4 = save - tmpf_4;
                save = tmpf_2;
                tmpf_2 += tmpf_3;
                tmpf_3 = save - tmpf_3;

                // End 6 point IDCT
                // Twiddle factors on indices (for 12 point IDCT)

                tmpf_0 *= 0.504314480;
                tmpf_1 *= 0.541196100;
                tmpf_2 *= 0.630236207;
                tmpf_3 *= 0.821339815;
                tmpf_4 *= 1.306562965;
                tmpf_5 *= 3.830648788;

                // End 12 point IDCT

                // Shift to 12 point modified IDCT, multiply by window type 2
                tmpf_8 = -tmpf_0 * 0.793353340;
                tmpf_9 = -tmpf_0 * 0.608761429;
                tmpf_7 = -tmpf_1 * 0.923879532;
                tmpf_10 = -tmpf_1 * 0.382683432;
                tmpf_6 = -tmpf_2 * 0.991444861;
                tmpf_11 = -tmpf_2 * 0.130526192;

                tmpf_0 = tmpf_3;
                tmpf_1 = tmpf_4 * 0.382683432;
                tmpf_2 = tmpf_5 * 0.608761429;

                tmpf_3 = -tmpf_5 * 0.793353340;
                tmpf_4 = -tmpf_4 * 0.923879532;
                tmpf_5 = -tmpf_0 * 0.991444861;

                tmpf_0 *= 0.130526192;

                out[six_i + 6] += tmpf_0;
                out[six_i + 7] += tmpf_1;
                out[six_i + 8] += tmpf_2;
                out[six_i + 9] += tmpf_3;
                out[six_i + 10] += tmpf_4;
                out[six_i + 11] += tmpf_5;
                out[six_i + 12] += tmpf_6;
                out[six_i + 13] += tmpf_7;
                out[six_i + 14] += tmpf_8;
                out[six_i + 15] += tmpf_9;
                out[six_i + 16] += tmpf_10;
                out[six_i + 17] += tmpf_11;

                six_i += 6;
            }
        }
        else {
            // 36 point IDCT
            // input aliasing for 36 point IDCT
            inp[17] += inp[16];
            inp[16] += inp[15];
            inp[15] += inp[14];
            inp[14] += inp[13];
            inp[13] += inp[12];
            inp[12] += inp[11];
            inp[11] += inp[10];
            inp[10] += inp[9];
            inp[9] += inp[8];
            inp[8] += inp[7];
            inp[7] += inp[6];
            inp[6] += inp[5];
            inp[5] += inp[4];
            inp[4] += inp[3];
            inp[3] += inp[2];
            inp[2] += inp[1];
            inp[1] += inp[0];

            // 18 point IDCT for odd indices
            // input aliasing for 18 point IDCT
            inp[17] += inp[15];
            inp[15] += inp[13];
            inp[13] += inp[11];
            inp[11] += inp[9];
            inp[9] += inp[7];
            inp[7] += inp[5];
            inp[5] += inp[3];
            inp[3] += inp[1];

            let tmp0, tmp1, tmp2, tmp3, tmp4, tmp0_, tmp1_, tmp2_, tmp3_;
            let tmp0o, tmp1o, tmp2o, tmp3o, tmp4o, tmp0_o, tmp1_o, tmp2_o, tmp3_o;

            // Fast 9 Point Inverse Discrete Cosine Transform
            //
            // By  Francois-Raymond Boyer
            //         mailto:boyerf@iro.umontreal.ca
            //         http://www.iro.umontreal.ca/~boyerf
            //
            // The code has been optimized for Intel processors
            //  (takes a lot of time to convert float to and from iternal FPU representation)
            //
            // It is a simple "factorization" of the IDCT matrix.

            // 9 point IDCT on even indices

            // 5 points on odd indices (not realy an IDCT)
            let i00 = inp[0] + inp[0];
            let iip12 = i00 + inp[12];

            tmp0 = iip12 + inp[4] * 1.8793852415718 + inp[8] * 1.532088886238 + inp[16] * 0.34729635533386;
            tmp1 = i00 + inp[4] - inp[8] - inp[12] - inp[12] - inp[16];
            tmp2 = iip12 - inp[4] * 0.34729635533386 - inp[8] * 1.8793852415718 + inp[16] * 1.532088886238;
            tmp3 = iip12 - inp[4] * 1.532088886238 + inp[8] * 0.34729635533386 - inp[16] * 1.8793852415718;
            tmp4 = inp[0] - inp[4] + inp[8] - inp[12] + inp[16];

            // 4 points on even indices
            let i66_ = inp[6] * 1.732050808;		// Sqrt[3]
            tmp0_ = inp[2] * 1.9696155060244 + i66_ + inp[10] * 1.2855752193731 + inp[14] * 0.68404028665134;
            tmp1_ = (inp[2] - inp[10] - inp[14]) * 1.732050808;
            tmp2_ = inp[2] * 1.2855752193731 - i66_ - inp[10] * 0.68404028665134 + inp[14] * 1.9696155060244;
            tmp3_ = inp[2] * 0.68404028665134 - i66_ + inp[10] * 1.9696155060244 - inp[14] * 1.2855752193731;

            // 9 point IDCT on odd indices
            // 5 points on odd indices (not realy an IDCT)
            let i0 = inp[1] + inp[1];
            let i0p12 = i0 + inp[12 + 1];

            tmp0o = i0p12 + inp[4 + 1] * 1.8793852415718 + inp[9] * 1.532088886238 + inp[17] * 0.34729635533386;
            tmp1o = i0 + inp[4 + 1] - inp[8 + 1] - inp[12 + 1] - inp[12 + 1] - inp[16 + 1];
            tmp2o = i0p12 - inp[4 + 1] * 0.34729635533386 - inp[8 + 1] * 1.8793852415718 + inp[16 + 1] * 1.532088886238;
            tmp3o = i0p12 - inp[4 + 1] * 1.532088886238 + inp[8 + 1] * 0.34729635533386 - inp[16 + 1] * 1.8793852415718;
            tmp4o = (inp[0 + 1] - inp[4 + 1] + inp[8 + 1] - inp[12 + 1] + inp[16 + 1]) * 0.707106781; // Twiddled

            // 4 points on even indices
            let i6_ = inp[6 + 1] * 1.732050808;		// Sqrt[3]

            tmp0_o = inp[2 + 1] * 1.9696155060244 + i6_ + inp[10 + 1] * 1.2855752193731 + inp[14 + 1] * 0.68404028665134;
            tmp1_o = (inp[2 + 1] - inp[10 + 1] - inp[14 + 1]) * 1.732050808;
            tmp2_o = inp[2 + 1] * 1.2855752193731 - i6_ - inp[10 + 1] * 0.68404028665134 + inp[14 + 1] * 1.9696155060244;
            tmp3_o = inp[2 + 1] * 0.68404028665134 - i6_ + inp[10 + 1] * 1.9696155060244 - inp[14 + 1] * 1.2855752193731;

            // Twiddle factors on odd indices
            // and
            // Butterflies on 9 point IDCT's
            // and
            // twiddle factors for 36 point IDCT

            let e, o;
            e = tmp0 + tmp0_;
            o = (tmp0o + tmp0_o) * 0.501909918;
            tmpf_0 = e + o;
            tmpf_17 = e - o;
            e = tmp1 + tmp1_;
            o = (tmp1o + tmp1_o) * 0.517638090;
            tmpf_1 = e + o;
            tmpf_16 = e - o;
            e = tmp2 + tmp2_;
            o = (tmp2o + tmp2_o) * 0.551688959;
            tmpf_2 = e + o;
            tmpf_15 = e - o;
            e = tmp3 + tmp3_;
            o = (tmp3o + tmp3_o) * 0.610387294;
            tmpf_3 = e + o;
            tmpf_14 = e - o;
            tmpf_4 = tmp4 + tmp4o;
            tmpf_13 = tmp4 - tmp4o;
            e = tmp3 - tmp3_;
            o = (tmp3o - tmp3_o) * 0.871723397;
            tmpf_5 = e + o;
            tmpf_12 = e - o;
            e = tmp2 - tmp2_;
            o = (tmp2o - tmp2_o) * 1.183100792;
            tmpf_6 = e + o;
            tmpf_11 = e - o;
            e = tmp1 - tmp1_;
            o = (tmp1o - tmp1_o) * 1.931851653;
            tmpf_7 = e + o;
            tmpf_10 = e - o;
            e = tmp0 - tmp0_;
            o = (tmp0o - tmp0_o) * 5.736856623;
            tmpf_8 = e + o;
            tmpf_9 = e - o;

            // end 36 point IDCT */
            // shift to modified IDCT
            win_bt = win[block_type];

            out[0] = -tmpf_9 * win_bt[0];
            out[1] = -tmpf_10 * win_bt[1];
            out[2] = -tmpf_11 * win_bt[2];
            out[3] = -tmpf_12 * win_bt[3];
            out[4] = -tmpf_13 * win_bt[4];
            out[5] = -tmpf_14 * win_bt[5];
            out[6] = -tmpf_15 * win_bt[6];
            out[7] = -tmpf_16 * win_bt[7];
            out[8] = -tmpf_17 * win_bt[8];
            out[9] = tmpf_17 * win_bt[9];
            out[10] = tmpf_16 * win_bt[10];
            out[11] = tmpf_15 * win_bt[11];
            out[12] = tmpf_14 * win_bt[12];
            out[13] = tmpf_13 * win_bt[13];
            out[14] = tmpf_12 * win_bt[14];
            out[15] = tmpf_11 * win_bt[15];
            out[16] = tmpf_10 * win_bt[16];
            out[17] = tmpf_9 * win_bt[17];
            out[18] = tmpf_8 * win_bt[18];
            out[19] = tmpf_7 * win_bt[19];
            out[20] = tmpf_6 * win_bt[20];
            out[21] = tmpf_5 * win_bt[21];
            out[22] = tmpf_4 * win_bt[22];
            out[23] = tmpf_3 * win_bt[23];
            out[24] = tmpf_2 * win_bt[24];
            out[25] = tmpf_1 * win_bt[25];
            out[26] = tmpf_0 * win_bt[26];
            out[27] = tmpf_0 * win_bt[27];
            out[28] = tmpf_1 * win_bt[28];
            out[29] = tmpf_2 * win_bt[29];
            out[30] = tmpf_3 * win_bt[30];
            out[31] = tmpf_4 * win_bt[31];
            out[32] = tmpf_5 * win_bt[32];
            out[33] = tmpf_6 * win_bt[33];
            out[34] = tmpf_7 * win_bt[34];
            out[35] = tmpf_8 * win_bt[35];
        }
    }

};

function reorder(scalefac_band) {
    let j = 0;
    const ix = new Array(576); //int[576];
    for (let sfb = 0; sfb < 13; sfb++) {
        const start = scalefac_band[sfb];
        const end = scalefac_band[sfb + 1];
        for (let window = 0; window < 3; window++)
            for (let i = start; i < end; i++)
                ix[3 * i + window] = j++;
    }
    return ix;
}

class gr_info_s {
    constructor() {
        this.part2_3_length = 0;
        this.big_values = 0;
        this.global_gain = 0;
        this.scalefac_compress = 0;
        this.window_switching_flag = 0;
        this.block_type = 0;
        this.mixed_block_flag = 0;
        this.region0_count = 0;
        this.region1_count = 0;
        this.preflag = 0;
        this.scalefac_scale = 0;
        this.count1table_select = 0;
        this.table_select = (new Array(3)).fill(0);
        this.subblock_gain = (new Array(3)).fill(0);
    }
}

class temporaire {
    constructor() {
        this.scfsi = (new Array(4)).fill(0);
        this.gr = [new gr_info_s(), new gr_info_s()];
    }
}

class III_side_info_t {
    constructor() {
        this.main_data_begin = 0;
        this.private_bits = 0;
        this.ch = [new temporaire(), new temporaire()]
    }
}

class temporaire2 {
    constructor() {
        this.l = (new Array(23)).fill(0);
        this.s = (new Array(3)).fill().map(() => {
            return (new Array(13)).fill(0);
        })
    }
}

class SBI {
    constructor(thel = null, thes = null) {
        this.l = thel || (new Array(23)).fill(0);
        this.s = thes || (new Array(14)).fill(0);
    }
}

const d43 = (4 / 3);
const SSLIMIT = 18;
const SBLIMIT = 32;

let reorder_table = null;

const slen = [
    [0, 0, 0, 0, 3, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4],
    [0, 1, 2, 3, 0, 1, 2, 3, 1, 2, 3, 1, 2, 3, 2, 3]
];

const t_43 = (() => {
    const t43 = (new Array(8192)).fill(0.0);
    const d43 = 4.0 / 3.0;

    for (let i = 0; i < 8192; i++) {
        t43[i] = Math.pow(i, d43);
    }
    return t43;
})();

const two_to_negative_half_pow = [
    1.0000000000E+00, 7.0710678119E-01, 5.0000000000E-01, 3.5355339059E-01,
    2.5000000000E-01, 1.7677669530E-01, 1.2500000000E-01, 8.8388347648E-02,
    6.2500000000E-02, 4.4194173824E-02, 3.1250000000E-02, 2.2097086912E-02,
    1.5625000000E-02, 1.1048543456E-02, 7.8125000000E-03, 5.5242717280E-03,
    3.9062500000E-03, 2.7621358640E-03, 1.9531250000E-03, 1.3810679320E-03,
    9.7656250000E-04, 6.9053396600E-04, 4.8828125000E-04, 3.4526698300E-04,
    2.4414062500E-04, 1.7263349150E-04, 1.2207031250E-04, 8.6316745750E-05,
    6.1035156250E-05, 4.3158372875E-05, 3.0517578125E-05, 2.1579186438E-05,
    1.5258789062E-05, 1.0789593219E-05, 7.6293945312E-06, 5.3947966094E-06,
    3.8146972656E-06, 2.6973983047E-06, 1.9073486328E-06, 1.3486991523E-06,
    9.5367431641E-07, 6.7434957617E-07, 4.7683715820E-07, 3.3717478809E-07,
    2.3841857910E-07, 1.6858739404E-07, 1.1920928955E-07, 8.4293697022E-08,
    5.9604644775E-08, 4.2146848511E-08, 2.9802322388E-08, 2.1073424255E-08,
    1.4901161194E-08, 1.0536712128E-08, 7.4505805969E-09, 5.2683560639E-09,
    3.7252902985E-09, 2.6341780319E-09, 1.8626451492E-09, 1.3170890160E-09,
    9.3132257462E-10, 6.5854450798E-10, 4.6566128731E-10, 3.2927225399E-10
];

const pretab = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 3, 3, 3, 2, 0];

const cs = [
    0.857492925712, 0.881741997318, 0.949628649103, 0.983314592492,
    0.995517816065, 0.999160558175, 0.999899195243, 0.999993155067
];

const ca = [
    -0.5144957554270, -0.4717319685650, -0.3133774542040, -0.1819131996110,
    -0.0945741925262, -0.0409655828852, -0.0141985685725, -0.00369997467375
];

const win =
    [
        [-1.6141214951E-02, -5.3603178919E-02, -1.0070713296E-01, -1.6280817573E-01,
            -4.9999999679E-01, -3.8388735032E-01, -6.2061144372E-01, -1.1659756083E+00,
            -3.8720752656E+00, -4.2256286556E+00, -1.5195289984E+00, -9.7416483388E-01,
            -7.3744074053E-01, -1.2071067773E+00, -5.1636156596E-01, -4.5426052317E-01,
            -4.0715656898E-01, -3.6969460527E-01, -3.3876269197E-01, -3.1242222492E-01,
            -2.8939587111E-01, -2.6880081906E-01, -5.0000000266E-01, -2.3251417468E-01,
            -2.1596714708E-01, -2.0004979098E-01, -1.8449493497E-01, -1.6905846094E-01,
            -1.5350360518E-01, -1.3758624925E-01, -1.2103922149E-01, -2.0710679058E-01,
            -8.4752577594E-02, -6.4157525656E-02, -4.1131172614E-02, -1.4790705759E-02],

        [-1.6141214951E-02, -5.3603178919E-02, -1.0070713296E-01, -1.6280817573E-01,
            -4.9999999679E-01, -3.8388735032E-01, -6.2061144372E-01, -1.1659756083E+00,
            -3.8720752656E+00, -4.2256286556E+00, -1.5195289984E+00, -9.7416483388E-01,
            -7.3744074053E-01, -1.2071067773E+00, -5.1636156596E-01, -4.5426052317E-01,
            -4.0715656898E-01, -3.6969460527E-01, -3.3908542600E-01, -3.1511810350E-01,
            -2.9642226150E-01, -2.8184548650E-01, -5.4119610000E-01, -2.6213228100E-01,
            -2.5387916537E-01, -2.3296291359E-01, -1.9852728987E-01, -1.5233534808E-01,
            -9.6496400054E-02, -3.3423828516E-02, 0.0000000000E+00, 0.0000000000E+00,
            0.0000000000E+00, 0.0000000000E+00, 0.0000000000E+00, 0.0000000000E+00],

        [-4.8300800645E-02, -1.5715656932E-01, -2.8325045177E-01, -4.2953747763E-01,
            -1.2071067795E+00, -8.2426483178E-01, -1.1451749106E+00, -1.7695290101E+00,
            -4.5470225061E+00, -3.4890531002E+00, -7.3296292804E-01, -1.5076514758E-01,
            0.0000000000E+00, 0.0000000000E+00, 0.0000000000E+00, 0.0000000000E+00,
            0.0000000000E+00, 0.0000000000E+00, 0.0000000000E+00, 0.0000000000E+00,
            0.0000000000E+00, 0.0000000000E+00, 0.0000000000E+00, 0.0000000000E+00,
            0.0000000000E+00, 0.0000000000E+00, 0.0000000000E+00, 0.0000000000E+00,
            0.0000000000E+00, 0.0000000000E+00, 0.0000000000E+00, 0.0000000000E+00,
            0.0000000000E+00, 0.0000000000E+00, 0.0000000000E+00, 0.0000000000E+00],

        [0.0000000000E+00, 0.0000000000E+00, 0.0000000000E+00, 0.0000000000E+00,
            0.0000000000E+00, 0.0000000000E+00, -1.5076513660E-01, -7.3296291107E-01,
            -3.4890530566E+00, -4.5470224727E+00, -1.7695290031E+00, -1.1451749092E+00,
            -8.3137738100E-01, -1.3065629650E+00, -5.4142014250E-01, -4.6528974900E-01,
            -4.1066990750E-01, -3.7004680800E-01, -3.3876269197E-01, -3.1242222492E-01,
            -2.8939587111E-01, -2.6880081906E-01, -5.0000000266E-01, -2.3251417468E-01,
            -2.1596714708E-01, -2.0004979098E-01, -1.8449493497E-01, -1.6905846094E-01,
            -1.5350360518E-01, -1.3758624925E-01, -1.2103922149E-01, -2.0710679058E-01,
            -8.4752577594E-02, -6.4157525656E-02, -4.1131172614E-02, -1.4790705759E-02]
    ];