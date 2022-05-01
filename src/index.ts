import assert from 'assert';
import axios from 'axios';
import { Address4, Address6 } from 'ip-address';

export interface AmazonIpv4Prefix {
  ip_prefix: string;
  region: string;
  service: string;
  network_border_group: string;
}

export interface AmazonIpv6Prefix {
  ipv6_prefix: string;
  region: string;
  service: string;
  network_border_group: string;
}

export interface AmazonIpRangesResponse {
  syncToken?: string;
  createDate?: string;
  prefixes?: AmazonIpv4Prefix[];
  ipv6_prefixes?: AmazonIpv6Prefix[];
}

export async function getPrefixes() {
  const endpoint = 'https://ip-ranges.amazonaws.com/ip-ranges.json';
  const get = await axios({
    url: process.env['AWS_END_POINT'] || endpoint,
    method: 'GET',
  });

  const prefixes: AmazonIpRangesResponse = get.data;

  return prefixes;
}

export async function handleV4(subnet: string) {
  const prefixes = await getPrefixes();

  const found = [];

  const _subnet = new Address4(subnet);

  assert(prefixes.prefixes, 'unable to get amazon v4 prefixes');

  if (_subnet.isCorrect()) {
    for (const prefix of prefixes.prefixes) {
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

export async function handleV6(subnet: string) {
  const prefixes = await getPrefixes();

  const found = [];

  const _subnet = new Address6(subnet);

  assert(prefixes.ipv6_prefixes, 'unable to get amazon v6 prefixes');

  if (_subnet.isCorrect()) {
    for (const prefix of prefixes.ipv6_prefixes) {
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

export function getType(subnet: string) {
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

export async function searchPrefixes(subnet: string) {
  const type = getType(subnet);

  let found;

  if (type === 'v4') {
    found = await handleV4(subnet);
  } else if (type === 'v6') {
    found = await handleV6(subnet);
  }

  console.log(found);
  return found;
}

searchPrefixes('46.51.192.0');
searchPrefixes('2600:1f70:c000::/56');
