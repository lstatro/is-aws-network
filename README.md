A library to determine if a publicly routable IP belongs to amazon.

# Modes

There are two modes, online and offline.

By default this library uses online mode where it will reach out to an amazon endpoint for the most up to date ip information. However, for environments that do not allow outbound access there is a local copy of Amazon's IP ranges.

## Online Mode

The tool will reach out once to get Amazon's prefixes and caches the results when the class is initiated.

_Note new instantiations of the class will result in new requests._

```typescript
// https://ip-ranges.amazonaws.com/ip-ranges.json

new AmazonNetwork().setSubnet('46.51.192.0').search();
```

## Offline Mode

Amazon may change their subnets at any point, use offline mode only if outbound access is not available.

```typescript
new AmazonNetwork({ subnet: '2600:1f70:c000::/56', offline: true }).search();
```
