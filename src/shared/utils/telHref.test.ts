import { toTelHref } from './telHref';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

assertEqual(toTelHref(''), null, 'empty string is not callable');
assertEqual(toTelHref('   '), null, 'whitespace is not callable');
assertEqual(toTelHref('123'), null, 'too few digits is not callable');
assertEqual(toTelHref('9876543210'), 'tel:9876543210', 'local 10-digit India number');
assertEqual(toTelHref('+91 98765 43210'), 'tel:+919876543210', 'keeps country code');
assertEqual(toTelHref('tel:+919876543210'), 'tel:+919876543210', 'existing tel href');
assertEqual(toTelHref('tel:9876543210'), 'tel:9876543210', 'tel href without plus');

if (failed.length > 0) {
  console.error(failed.join('\n'));
  process.exit(1);
}

console.log('telHref.test.ts passed');
