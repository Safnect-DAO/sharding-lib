# sharding-lib
This is a library that shards the original decimal private key and provides sharding and recovery functions.

<br>


Generate private and public keys and shard them

```
const [shares, publicKey, secret] = generateSharesAndPublicKey(groupSize, threshold);
```
<br>


groupSize: How many pieces to divide

threshold: Only a few pieces are needed to recover

```
const groupSize = 3;
const threshold = 2;
```
<br>
<br>
Sharding the existing private key

secret: Decimal private key string

groupSize: How many pieces to divide

threshold: Only a few pieces are needed to recover

```
const shares = secretSharing(secret, groupSize, threshold);
```

<br>
Recovering full shards by sharding

```
restoreKey(points, threshold)
```

<br>
Recovering a decimal private Key

```
restoreKey(points, threshold)
```

<br>
Example 1:

```
  const groupSize = 3;
  const threshold = 2;
  
  const shares = secretSharing(BigInt('111101183022807047155270493419307740024346749804233364942326961530469514591429'), groupSize, threshold);
  console.log(shares);
  
  
   // Recover the private key, the serial number must be correct and serial number starts from 1.
  const points = [[BigInt(1), BigInt('56140442899029318590809998015452486146980190513573026151363664164244037336519')], 
    [BigInt(3), BigInt('62011051888790056885459992216429886245084636211327252952042232573311244321036')]];
    
  const reconstructedSecret = restoreKey(points, threshold);
  console.log(`Reconstructed secret: ${reconstructedSecret}`);
```

<br>
Example 2:

```
  const [shares, publicKey, secret] = generateSharesAndPublicKey(groupSize, threshold);
  console.log('shares', inspect(shares));
  console.log('Public key', publicKey);
  console.log('secret', secret);
  
  const restoredKey = restoreKey(sharesToPoints(shares).slice(0, threshold), threshold);
  const restoredShare = restoreShare(sharesToPoints(shares).slice(0, threshold), threshold);
  console.log('restored key =', restoredKey);
  console.log('restored_share =', restoredShare);
```
