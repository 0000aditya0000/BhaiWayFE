/**
 * BhaiWay iOS native crash fix for react-native-maps:
 * Fixes EXC_CRASH (SIGABRT): *** -[__NSArrayM insertObject:atIndex:]: object cannot be nil
 * in -[AIRMap insertReactSubview:atIndex:] (AIRMap.m:138) and AIRGoogleMap.m.
 *
 * This occurs under React Native Fabric / New Architecture (RCTLegacyViewManagerInteropComponentView)
 * when subviews are nil or mounting transactions desynchronize indices.
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function patchAirMap() {
  const filePath = path.join(rootDir, 'node_modules', 'react-native-maps', 'ios', 'AirMaps', 'AIRMap.m');
  if (!fs.existsSync(filePath)) {
    console.log('[patch-react-native-maps] AIRMap.m not found, skipping.');
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 1. Guard subview == nil in insertReactSubview
  const insertTarget = '- (void)insertReactSubview:(id<RCTComponent>)subview atIndex:(NSInteger)atIndex {\n    // Our desired API';
  const insertReplacement = '- (void)insertReactSubview:(id<RCTComponent>)subview atIndex:(NSInteger)atIndex {\n    if (subview == nil) {\n        return;\n    }\n    // Our desired API';
  if (content.includes(insertTarget)) {
    content = content.replace(insertTarget, insertReplacement);
    modified = true;
  }

  // 2. Safe index and bounds check for _reactSubviews insertObject:atIndex:
  const arrayInsertTarget = '[_reactSubviews insertObject:(UIView *)subview atIndex:(NSUInteger) atIndex];';
  const arrayInsertReplacement = 'NSUInteger safeIndex = atIndex < 0 ? 0 : MIN((NSUInteger)atIndex, _reactSubviews.count);\n    [_reactSubviews insertObject:(UIView *)subview atIndex:safeIndex];';
  if (content.includes(arrayInsertTarget)) {
    content = content.replace(arrayInsertTarget, arrayInsertReplacement);
    modified = true;
  }

  // 3. Guard subview == nil in removeReactSubview
  const removeTarget = '- (void)removeReactSubview:(id<RCTComponent>)subview {\n    // similarly, when the children';
  const removeReplacement = '- (void)removeReactSubview:(id<RCTComponent>)subview {\n    if (subview == nil) {\n        return;\n    }\n    // similarly, when the children';
  if (content.includes(removeTarget)) {
    content = content.replace(removeTarget, removeReplacement);
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('[patch-react-native-maps] Successfully patched AIRMap.m with nil and bounds guards.');
    return true;
  } else {
    console.log('[patch-react-native-maps] AIRMap.m already patched or signature mismatch.');
    return false;
  }
}

function patchAirGoogleMap() {
  const filePath = path.join(rootDir, 'node_modules', 'react-native-maps', 'ios', 'AirGoogleMaps', 'AIRGoogleMap.m');
  if (!fs.existsSync(filePath)) {
    console.log('[patch-react-native-maps] AIRGoogleMap.m not found, skipping.');
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 1. Guard subview == nil in insertReactSubview
  const insertTarget = '- (void)insertReactSubview:(id<RCTComponent>)subview atIndex:(NSInteger)atIndex {\n  // Our desired API';
  const insertReplacement = '- (void)insertReactSubview:(id<RCTComponent>)subview atIndex:(NSInteger)atIndex {\n  if (subview == nil) {\n    return;\n  }\n  // Our desired API';
  if (content.includes(insertTarget)) {
    content = content.replace(insertTarget, insertReplacement);
    modified = true;
  }

  // 2. Safe index and bounds check for _reactSubviews insertObject:atIndex:
  const arrayInsertTarget = '[_reactSubviews insertObject:(UIView *)subview atIndex:(NSUInteger) atIndex];';
  const arrayInsertReplacement = 'NSUInteger safeIndex = atIndex < 0 ? 0 : MIN((NSUInteger)atIndex, _reactSubviews.count);\n  [_reactSubviews insertObject:(UIView *)subview atIndex:safeIndex];';
  if (content.includes(arrayInsertTarget)) {
    content = content.replace(arrayInsertTarget, arrayInsertReplacement);
    modified = true;
  }

  // 3. Guard subview == nil in removeReactSubview
  const removeTarget = '- (void)removeReactSubview:(id<RCTComponent>)subview {\n  // similarly, when the children';
  const removeReplacement = '- (void)removeReactSubview:(id<RCTComponent>)subview {\n  if (subview == nil) {\n    return;\n  }\n  // similarly, when the children';
  if (content.includes(removeTarget)) {
    content = content.replace(removeTarget, removeReplacement);
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('[patch-react-native-maps] Successfully patched AIRGoogleMap.m with nil and bounds guards.');
    return true;
  } else {
    console.log('[patch-react-native-maps] AIRGoogleMap.m already patched or signature mismatch.');
    return false;
  }
}

patchAirMap();
patchAirGoogleMap();

