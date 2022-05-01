import assert from 'assert';
import axios from 'axios';
import { Address4, Address6 } from 'ip-address';
import { readFileSync } from 'fs';

interface AmazonIpv4Prefix {
  ip_prefix: string;
  region: string;
  service: string;
  network_border_group: string;
}

interface AmazonIpv6Prefix {
  ipv6_prefix: string;
  region: string;
  service: string;
  network_border_group: string;
}

interface AmazonIpRangesResponse {
  syncToken?: string;
  createDate?: string;
  prefixes?: AmazonIpv4Prefix[];
  ipv6_prefixes?: AmazonIpv6Prefix[];
}

interface IsAmazonNetworkClass {
  subnet?: string;
  endpoint?: string;
  offline?: boolean;
}

export class AmazonNetwork {
  protected endpoint = 'https://ip-ranges.amazonaws.com/ip-ranges.json';
  protected ranges?: AmazonIpRangesResponse;
  protected subnet?: string;
  protected prefixes?: AmazonIpRangesResponse;

  constructor(params: IsAmazonNetworkClass = {}) {
    this.endpoint = params.endpoint || this.endpoint;
    this.subnet = params.subnet;

    if (params.offline === true) {
      this.prefixes = readFileSync(
        './offline-prefixes.json'
      ) as AmazonIpRangesResponse;
    }
  }

  protected async setPrefixes() {
    const get = await axios({
      url: this.endpoint,
      method: 'GET',
    });

    this.prefixes = get.data;

    return this;
  }

  protected async handleV4() {
    assert(this.subnet, 'missing subnet');
    if (this.prefixes === undefined) {
      await this.setPrefixes();
    }

    assert(this.prefixes, 'missing all amazon prefixes');
    assert(this.prefixes.prefixes, 'unable to get amazon v4 prefixes');

    const found = [];

    const _subnet = new Address4(this.subnet);

    if (_subnet.isCorrect()) {
      for (const prefix of this.prefixes.prefixes) {
        if (prefix.ip_prefix) {
          const supernet = new Address4(prefix.ip_prefix);
          if (_subnet.isInSubnet(supernet)) {
            found.push(prefix);
          }
        }
      }
    }
    return found;
  }

  protected async handleV6() {
    assert(this.subnet, 'missing subnet');

    if (this.prefixes === undefined) {
      await this.setPrefixes();
    }

    assert(this.prefixes, 'missing all amazon prefixes');
    assert(this.prefixes.ipv6_prefixes, 'unable to get amazon v6 prefixes');

    const found = [];

    const _subnet = new Address6(this.subnet);

    if (_subnet.isCorrect()) {
      for (const prefix of this.prefixes.ipv6_prefixes) {
        if (prefix.ipv6_prefix) {
          const supernet = new Address6(prefix.ipv6_prefix);
          if (_subnet.isInSubnet(supernet)) {
            found.push(prefix);
          }
        }
      }
    }
    return found;
  }

  protected getType(subnet: string) {
    let type: 'v4' | 'v6';
    try {
      new Address4(subnet);
      type = 'v4';
    } catch (err) {
      new Address6(subnet);
      type = 'v6';
    }

    return type;
  }

  setSubnet(subnet: string) {
    this.subnet = subnet;
    return this;
  }

  async search() {
    assert(this.subnet, 'missing subnet');

    const type = this.getType(this.subnet);

    let found;

    if (type === 'v4') {
      found = await this.handleV4();
    } else if (type === 'v6') {
      found = await this.handleV6();
    }

    console.log(found);
    return found;
  }
}

new AmazonNetwork().setSubnet('46.51.192.0').search();
new AmazonNetwork({ subnet: '2600:1f70:c000::/56', offline: true }).search();
