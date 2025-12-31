/**
 * ZKTeco Binary Protocol Client
 * 
 * Custom implementation for eSSL/ZKTeco devices that don't work with node-zklib
 * Based on protocol specification from https://github.com/adrobinoga/zk-protocol
 */

const net = require('net');

// Command IDs (little-endian)
const CMD = {
    CONNECT: 0x03e8,        // 1000
    EXIT: 0x03e9,           // 1001
    ENABLEDEVICE: 0x03ea,   // 1002
    DISABLEDEVICE: 0x03eb,  // 1003
    REFRESHDATA: 0x03f5,    // 1013
    AUTH: 0x044e,           // 1102 - Auth with commkey
    PREPARE_DATA: 0x05dc,   // 1500
    DATA: 0x05dd,           // 1501
    FREE_DATA: 0x05de,      // 1502
    USER_WRQ: 0x0008,       // 8 - Upload user
    USERTEMP_WRQ: 0x000a,   // 10 - Upload fingerprint template
    ACK_OK: 0x07d0,         // 2000
    ACK_ERROR: 0x07d1,      // 2001
    ACK_DATA: 0x07d2,       // 2002
    ACK_UNAUTH: 0x1771,     // 6001 - Unauthorized
};

// Packet magic number
const PACKET_START = Buffer.from([0x50, 0x50, 0x82, 0x7d]);

/**
 * Generate authentication key hash
 * Ported from pyzk's make_commkey function
 * @param {number} key - CommKey password
 * @param {number} sessionId - Session ID from device
 * @param {number} ticks - Ticks value (default 50)
 * @returns {Buffer} - 8-byte authentication key
 */
function makeCommKey(key, sessionId, ticks = 50) {
    key = parseInt(key) || 0;
    sessionId = parseInt(sessionId) || 0;

    // Reverse bits of key and accumulate
    let k = 0;
    for (let i = 0; i < 32; i++) {
        if (key & (1 << i)) {
            k = (k << 1) | 1;
        } else {
            k = k << 1;
        }
    }
    k = (k + sessionId) >>> 0; // Ensure unsigned

    // Convert to bytes
    const kBuf = Buffer.alloc(4);
    kBuf.writeUInt32LE(k, 0);

    // XOR with 'ZKSO'
    const xored = Buffer.from([
        kBuf[0] ^ 'Z'.charCodeAt(0),
        kBuf[1] ^ 'K'.charCodeAt(0),
        kBuf[2] ^ 'S'.charCodeAt(0),
        kBuf[3] ^ 'O'.charCodeAt(0)
    ]);

    // Swap 16-bit words
    const swapped = Buffer.from([xored[2], xored[3], xored[0], xored[1]]);

    // XOR with ticks
    const B = 0xff & ticks;
    const result = Buffer.from([
        swapped[0] ^ B,
        swapped[1] ^ B,
        B,
        swapped[3] ^ B
    ]);

    return result;
}

class ZKTecoClient {
    constructor(ip, port = 4370, timeout = 10000) {
        this.ip = ip;
        this.port = port;
        this.timeout = timeout;
        this.socket = null;
        this.sessionId = 0;
        this.replyNumber = 0;
    }

    /**
     * Calculate checksum for packet
     * Algorithm: Sum all bytes as 16-bit words, then invert
     */
    calculateChecksum(data) {
        let sum = 0;
        for (let i = 0; i < data.length; i += 2) {
            if (i + 1 < data.length) {
                sum += (data[i] | (data[i + 1] << 8));
            } else {
                sum += data[i];
            }
        }
        sum = (sum & 0xffff) + (sum >> 16);
        return (~sum) & 0xffff;
    }

    /**
     * Build a packet
     */
    buildPacket(commandId, data = Buffer.alloc(0)) {
        const payloadSize = 8 + data.length;

        // Build payload (command + checksum + session + reply + data)
        const payload = Buffer.alloc(payloadSize);
        payload.writeUInt16LE(commandId, 0);
        // Checksum will be calculated after
        payload.writeUInt16LE(this.sessionId, 4);
        payload.writeUInt16LE(this.replyNumber, 6);

        if (data.length > 0) {
            data.copy(payload, 8);
        }

        // Calculate checksum (skip checksum field itself during calculation)
        const forChecksum = Buffer.concat([
            payload.subarray(0, 2),
            Buffer.from([0, 0]),
            payload.subarray(4)
        ]);
        const checksum = this.calculateChecksum(forChecksum);
        payload.writeUInt16LE(checksum, 2);

        // Build complete packet
        const packet = Buffer.alloc(8 + payloadSize);
        PACKET_START.copy(packet, 0);
        packet.writeUInt32LE(payloadSize, 4);
        payload.copy(packet, 8);

        return packet;
    }

    /**
     * Parse response packet
     */
    parseResponse(data) {
        if (data.length < 16) {
            return null;
        }

        // Check magic
        if (!data.subarray(0, 4).equals(PACKET_START)) {
            console.log('[ZKTeco] Invalid magic:', data.subarray(0, 4).toString('hex'));
            return null;
        }

        const payloadSize = data.readUInt32LE(4);
        const commandId = data.readUInt16LE(8);
        const checksum = data.readUInt16LE(10);
        const sessionId = data.readUInt16LE(12);
        const replyNumber = data.readUInt16LE(14);

        const responseData = data.length > 16 ? data.subarray(16) : Buffer.alloc(0);

        return {
            commandId,
            checksum,
            sessionId,
            replyNumber,
            data: responseData
        };
    }

    /**
     * Send command and wait for response
     */
    async sendCommand(commandId, data = Buffer.alloc(0)) {
        return new Promise((resolve, reject) => {
            const packet = this.buildPacket(commandId, data);

            console.log(`[ZKTeco] Sending command 0x${commandId.toString(16)}, packet size: ${packet.length}`);

            let responseBuffer = Buffer.alloc(0);

            const onData = (chunk) => {
                responseBuffer = Buffer.concat([responseBuffer, chunk]);

                // Check if we have a complete packet
                if (responseBuffer.length >= 8) {
                    const expectedSize = responseBuffer.readUInt32LE(4) + 8;
                    if (responseBuffer.length >= expectedSize) {
                        this.socket.removeListener('data', onData);
                        const response = this.parseResponse(responseBuffer.subarray(0, expectedSize));

                        if (response) {
                            this.replyNumber++;
                            resolve(response);
                        } else {
                            reject(new Error('Invalid response packet'));
                        }
                    }
                }
            };

            const timeout = setTimeout(() => {
                this.socket.removeListener('data', onData);
                reject(new Error('Response timeout'));
            }, this.timeout);

            this.socket.on('data', onData);
            this.socket.write(packet, (err) => {
                if (err) {
                    clearTimeout(timeout);
                    this.socket.removeListener('data', onData);
                    reject(err);
                }
            });
        });
    }

    /**
     * Connect to device
     */
    async connect(commKey = 0) {
        return new Promise((resolve, reject) => {
            this.socket = new net.Socket();

            this.socket.setTimeout(this.timeout);

            this.socket.on('timeout', () => {
                this.socket.destroy();
                reject(new Error('Connection timeout'));
            });

            this.socket.on('error', (err) => {
                reject(err);
            });

            this.socket.connect(this.port, this.ip, async () => {
                console.log(`[ZKTeco] TCP connected to ${this.ip}:${this.port}`);

                try {
                    // Send connect command
                    const response = await this.sendCommand(CMD.CONNECT);

                    if (response.commandId === CMD.ACK_OK) {
                        this.sessionId = response.sessionId;
                        console.log(`[ZKTeco] Session established: ${this.sessionId}`);
                        resolve(true);
                    } else if (response.commandId === CMD.ACK_UNAUTH) {
                        // Device requires authentication
                        console.log(`[ZKTeco] Device requires authentication, session: ${response.sessionId}`);
                        this.sessionId = response.sessionId;

                        // Generate hashed authentication key
                        const authData = makeCommKey(commKey, this.sessionId);
                        console.log(`[ZKTeco] Sending auth with hashed key: ${authData.toString('hex')}`);

                        const authResponse = await this.sendCommand(CMD.AUTH, authData);
                        if (authResponse.commandId === CMD.ACK_OK) {
                            console.log(`[ZKTeco] Authentication successful`);
                            resolve(true);
                        } else {
                            reject(new Error(`Authentication failed with code: ${authResponse.commandId}`));
                        }
                    } else {
                        reject(new Error(`Connect failed with code: ${response.commandId}`));
                    }
                } catch (err) {
                    reject(err);
                }
            });
        });
    }

    /**
     * Disconnect
     */
    async disconnect() {
        if (this.socket) {
            try {
                await this.sendCommand(CMD.EXIT);
            } catch (e) {
                // Ignore disconnect errors
            }
            this.socket.destroy();
            this.socket = null;
        }
    }

    /**
     * Disable device (required before template upload)
     */
    async disableDevice() {
        const response = await this.sendCommand(CMD.DISABLEDEVICE);
        return response.commandId === CMD.ACK_OK;
    }

    /**
     * Enable device
     */
    async enableDevice() {
        const response = await this.sendCommand(CMD.ENABLEDEVICE);
        return response.commandId === CMD.ACK_OK;
    }

    /**
     * Refresh data
     */
    async refreshData() {
        const response = await this.sendCommand(CMD.REFRESHDATA);
        return response.commandId === CMD.ACK_OK;
    }

    /**
     * Upload fingerprint template
     * @param {number} userSn - Internal user serial number
     * @param {number} fingerIndex - Finger index (0-9)
     * @param {Buffer} template - Fingerprint template data
     */
    async uploadFingerprintTemplate(userSn, fingerIndex, template) {
        try {
            // Disable device first
            await this.disableDevice();
            console.log('[ZKTeco] Device disabled');

            // Prepare data (send size)
            const prepData = Buffer.alloc(4);
            prepData.writeUInt16LE(template.length, 0);
            prepData.writeUInt16LE(0, 2);

            let response = await this.sendCommand(CMD.PREPARE_DATA, prepData);
            if (response.commandId !== CMD.ACK_OK) {
                throw new Error('PREPARE_DATA failed');
            }
            console.log('[ZKTeco] Data prepared');

            // Send template data
            response = await this.sendCommand(CMD.DATA, template);
            if (response.commandId !== CMD.ACK_OK) {
                throw new Error('DATA send failed');
            }
            console.log('[ZKTeco] Template data sent');

            // Write template to user
            const writeData = Buffer.alloc(6);
            writeData.writeUInt16LE(userSn, 0);
            writeData.writeUInt8(fingerIndex, 2);
            writeData.writeUInt8(1, 3); // Valid flag
            writeData.writeUInt16LE(template.length, 4);

            response = await this.sendCommand(CMD.USERTEMP_WRQ, writeData);
            if (response.commandId !== CMD.ACK_OK) {
                throw new Error('USERTEMP_WRQ failed');
            }
            console.log('[ZKTeco] Template written');

            // Free data buffer
            await this.sendCommand(CMD.FREE_DATA);

            // Refresh and enable
            await this.refreshData();
            await this.enableDevice();

            console.log('[ZKTeco] Template upload successful');
            return true;

        } catch (error) {
            // Try to re-enable device on error
            try {
                await this.enableDevice();
            } catch (e) { }
            throw error;
        }
    }
}

module.exports = ZKTecoClient;
