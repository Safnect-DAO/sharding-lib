const EllipticCurve = {
    name: 'Secp256k1',
    p: BigInt('0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f', 16),
    a: BigInt(0),
    b: BigInt(7),
    g: [BigInt('0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', 16), BigInt('0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8', 16)],
    n: BigInt('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141', 16),
    h: BigInt(1)
};

function onCurve(point) {
    if (!point) {
        return true;
    }
    let [x, y] = point;
    return (y * y - x * x * x - EllipticCurve.a * x - EllipticCurve.b) % EllipticCurve.p == 0
}

function negative(point) {
    if (!onCurve(point)) {
        throw new Error('Point is not on the curve');
    }
    if (point === null) {
        return null;
    }
    const [x, y] = point;
    let result_y = (-y % EllipticCurve.p + EllipticCurve.p) % EllipticCurve.p
    let result = [x, result_y]
    if (!onCurve(result)) {
        throw new Error('Point is not on the curve');
    }
    return result
}

function add(p, q) {
    if (!onCurve(p) || !onCurve(q)) {
        throw new Error('Points are not on the curve');
    }
    if (!p) {
        return q;
    }
    if (!q) {
        return p;
    }


    if (p == negative(q)) {
        return null
    }
    const [x1, y1] = p;
    const [x2, y2] = q;

    let m;
    if (p.toString() == q.toString()) {
        m = (BigInt(3) * x1 * x1 + EllipticCurve.a) * modularMultiplicativeInverse(BigInt(2) * y1, EllipticCurve.p)
    } else {
        m = (y1 - y2) * modularMultiplicativeInverse(x1 - x2, EllipticCurve.p)
    }
    let x = m * m - x1 - x2
    let y = y1 + m * (x - x1)

    let result_x = (x % EllipticCurve.p + EllipticCurve.p) % EllipticCurve.p
    let result_y = (-y % EllipticCurve.p + EllipticCurve.p) % EllipticCurve.p

    let result = [result_x, result_y]
    return result

}

function scalarMultiply(k, point) {
    if (!onCurve(point)) {
        throw new Error('Point is not on the curve');
    }
    if (((k % EllipticCurve.n + EllipticCurve.n) % EllipticCurve.n == 0) || point === null) {
        return null;
    }
    if (k < 0) {
        return scalarMultiply(-k, negative(point));
    }
    let result = null;
    let p = point;
    while (k) {
        if (k & BigInt(1)) {
            result = add(result, point)
        }
        point = add(point, point)
        k >>= BigInt(1)
    }
    return result;
}


function bigintFloor(a, b) {
    let result = a / b;
    if (a % b !== 0n && (a < 0n !== b < 0n)) {
        result -= 1n;
    }
    return result;
}

function intDiv(a, b) {
    // 向零取整
    if ((a > BigInt(0) && b > BigInt(0)) || (a < BigInt(0) && b < BigInt(0))) {
        return bigintFloor(a, b);
    } else {
        return bigintFloor(a, b);
    }
}

function extendedEuclidGCD(a, b) {
    let s = BigInt(0);
    let oldS = BigInt(1);
    let t = BigInt(1);
    let oldT = BigInt(0);
    let r = b;
    let oldR = a;
    while (!(r == BigInt(0))) {
        const quotient = intDiv(oldR, r);
        const temp = r;
        r = oldR - quotient * r
        oldR = temp;
        const tempS = s;
        s = oldS - quotient * s
        oldS = tempS;
        const tempT = t;
        t = oldT - quotient * t
        oldT = tempT;
    }
    return [oldR, oldS, oldT];
}

function modularMultiplicativeInverse(a, n) {
    let [gcd, x, y] = extendedEuclidGCD(a, n);
    if (x < 0) {
        x += n
    }
    return x
}

function getRandomBigInt(min, max) {
    if (min > max) {
        throw new Error("最小值必须小于或等于最大值");
    }

    const range = BigInt(max) - BigInt(min) + 1n; // 计算范围
    let rand = BigInt(0);
    const maxDigits = range.toString().length;

    do {
        let randomStr = "0";
        for (let i = 0; i < maxDigits; i++) {
            const randomDigit = Math.floor(Math.random() * 10); // 生成0-9的随机数字
            randomStr += randomDigit.toString();
        }
        rand = BigInt(randomStr);
        // console.log('rand: ', rand)
    } while (rand >= range);


    return BigInt(min) + rand; // 返回范围内的随机 BigInt
}

class Polynomial {
    static random(order, debug = false) {
        if (order < 1) {
            throw new Error('The polynomial order should be a positive integer');
        }
        const rangeStop = debug ? EllipticCurve.n : EllipticCurve.n;
        const coefficients = [getRandomBigInt(1, rangeStop)];
        for (let i = 0; i < order; i++) {
            coefficients.push(getRandomBigInt(1, rangeStop));
        }
        console.log('coefficients: ', coefficients)
        return new Polynomial(coefficients)
    }

    static interpolateEvaluate(points, x) {
        if (points.length < 2) {
            throw new Error('Lagrange interpolation requires at least 2 points');
        }
        const lagrange = Array(points.length).fill([BigInt(0), BigInt(0)]);
        let denominatorProduct = BigInt(1);
        for (let i = 0; i < points.length; i++) {
            let numerator = BigInt(1);
            let denominator = BigInt(1);
            for (let j = 0; j < points.length; j++) {
                if (j !== i) {
                    numerator *= (x - points[j][0])
                    denominator *= (points[i][0] - points[j][0])
                }
            }
            lagrange[i] = [(points[i][1] * numerator), denominator]
            denominatorProduct *= denominator
        }
        let numeratorSum = BigInt(0);
        for (const [numerator, denominator] of lagrange) {
            numeratorSum += intDiv(numerator * denominatorProduct, denominator)
        }
        const modInvDenominatorProduct = modularMultiplicativeInverse(denominatorProduct, EllipticCurve.n);
        let temp = numeratorSum * modInvDenominatorProduct
        return (temp % EllipticCurve.n + EllipticCurve.n) % EllipticCurve.n

    }

    constructor(coefficients) {
        if (coefficients.length < 2) {
            throw new Error('The polynomial should have 2 coefficients at least');
        }
        this.order = coefficients.length - 1;
        this.coefficients = coefficients.slice();
    }

    evaluate(x) {
        if (x === 0) {
            return this.coefficients[0];
        }
        let y = BigInt(0);
        let powX = BigInt(1);
        for (let i = 0; i < this.coefficients.length; i++) {
            y += (this.coefficients[i] * (powX));
            powX *= x
        }
        return (y % EllipticCurve.n + EllipticCurve.n) % EllipticCurve.n
    }

    add(other) {
        const coefficients = [];
        let i = 0;
        while (i < this.coefficients.length && i < other.coefficients.length) {
            coefficients.push(this.coefficients[i].plus(other.coefficients[i]).mod(EllipticCurve.n));
            i++;
        }
        while (i < this.coefficients.length) {
            coefficients.push(this.coefficients[i]);
            i++;
        }
        while (i < other.coefficients.length) {
            coefficients.push(other.coefficients[i]);
            i++;
        }
        return new Polynomial(coefficients);
    }

    multiply(other) {
        const coefficients = Array(this.order + other.order + 1).fill(BigInt(0));
        for (let i = 0; i < this.coefficients.length; i++) {
            for (let j = 0; j < other.coefficients.length; j++) {
                coefficients[i + j] = coefficients[i + j].plus(this.coefficients[i].multiply(other.coefficients[j]));
            }
        }
        for (let i = 0; i < coefficients.length; i++) {
            coefficients[i] = coefficients[i].mod(EllipticCurve.n);
        }
        return new Polynomial(coefficients);
    }

    toString() {
        return `<Polynomial order=${this.order}, coefficients=[${this.coefficients.join(', ')}]>`;
    }

    equals(other) {
        return this.coefficients.every((value, index) => value.eq(other.coefficients[index]));
    }
}

/*
 * Generate private and public keys and shard them
 * groupSize: How many pieces to divide
 * threshold: Only a few pieces are needed to recover
 */
function generateSharesAndPublicKey(groupSize, threshold, debug = true) {
    let secret
    const polynomialOrder = threshold - 1;
    const polynomials = Array.from({length: groupSize}, () => Polynomial.random(polynomialOrder, debug));
    if (debug) {
        polynomials.forEach((p, i) => console.log(`Player ${i + 1} ${p}`));
    }
    const shares = Array.from({length: groupSize}, (_, j) =>
        polynomials.reduce((sum, p) => sum + p.evaluate(BigInt(j + 1)), BigInt(0)) % (EllipticCurve.n)
    );
    let publicKey = null;
    let num = 0
    for (const p of polynomials) {
        num += 1
        publicKey = add(publicKey, scalarMultiply(p.coefficients[0], EllipticCurve.g));
    }
    if (debug) {
        let sum = BigInt(0)
        polynomials.forEach(item => {
            sum += item.coefficients[0]
        })
        secret = sum % EllipticCurve.n
        const modInvSecret = modularMultiplicativeInverse(secret, EllipticCurve.n);
        console.log(`secret = ${secret}`);
        console.log(`mod_inv_secret = ${modInvSecret}`);
        console.log(`public key = ${publicKey}`);
        console.log(`shares = ${shares}`);
    }
    return [shares, publicKey, secret];
}

// Recovering Private Keys
function restoreKey(points, threshold) {
    if (points.length < threshold) {
        throw new Error('The number of shares is less than the threshold');
    }
    return Polynomial.interpolateEvaluate(points, BigInt(0));
}

// Recovering full shards by sharding
function restoreShare(points, threshold) {
    if (points.length < threshold) {
        throw new Error('The number of shares is less than the threshold');
    }
    const exist = [points[0][0], points[1][0]];
    const fullList = [BigInt(1), BigInt(2), BigInt(3)];
    const missingNumber = fullList.filter(n => !exist.includes(n))[0];
    return [missingNumber, Polynomial.interpolateEvaluate(points, missingNumber)];
}

function sharesToPoints(shares) {
    return shares.map((share, i) => [BigInt(i + 1), share]);
}

function inspect(items) {
    return `[${items.join(', ')}]`;
}


/**
 * Sharding the existing private key
 * secret: Decimal private key string
 * groupSize: How many pieces to divide
 * threshold: Only a few pieces are needed to recover
 * Example: secretSharing(pk, 3, 2) ，Divide the key pk into 3 pieces, and only 2 of them are needed to recover the key
 *
 * return [Part 1, Part 2, Part 3]
 */
function secretSharing(secret, groupSize, threshold) {
    if (threshold > groupSize) {
        throw new Error("Threshold must be less than or equal to group size");
    }

    // Create a polynomial of degree threshold-1 with the secret as the constant term
    const coefficients = [secret];
    for (let i = 1; i < threshold; i++) {
        coefficients.push(getRandomBigInt(BigInt(1), EllipticCurve.n));
    }
    const polynomial = new Polynomial(coefficients);

    // Generate groupSize shares
    const shares = [];
    for (let i = 1; i <= groupSize; i++) {
        shares.push(polynomial.evaluate(BigInt(i)));
    }

    return shares;
}



/*
const groupSize = 3;
const threshold = 2;

const shares = secretSharing(BigInt('111101183022807047155270493419307740024346749804233364942326961530469514591429'), groupSize, threshold);
console.log(shares);


 // Recover the private key. The serial number position cannot be wrong. The serial number starts from 1.
const points = [[BigInt(1), BigInt('56140442899029318590809998015452486146980190513573026151363664164244037336519')], 
  [BigInt(3), BigInt('62011051888790056885459992216429886245084636211327252952042232573311244321036')]];
  
const reconstructedSecret = restoreKey(points, threshold);
console.log(`Reconstructed secret: ${reconstructedSecret}`);
*/

/*
const [shares, publicKey, secret] = generateSharesAndPublicKey(groupSize, threshold);
console.log('shares', inspect(shares));
console.log('Public key', publicKey);
console.log('secret', secret);

const restoredKey = restoreKey(sharesToPoints(shares).slice(0, threshold), threshold);
const restoredShare = restoreShare(sharesToPoints(shares).slice(0, threshold), threshold);
console.log('restored key =', restoredKey);
console.log('restored_share =', restoredShare);
*/
