import assert from 'node:assert/strict';

export interface MockDisclosureCallbacks {
  onConsent?: () => void | Promise<void>;
  onDecline?: () => void | Promise<void>;
}

export interface MockDisclosureState {
  visible: boolean;
  settingsGuideVisible: boolean;
  loading: boolean;
}

class TestDisclosureStore {
  private state: MockDisclosureState = {
    visible: false,
    settingsGuideVisible: false,
    loading: false,
  };
  private activeCallbacks: MockDisclosureCallbacks | null = null;
  private hasConsent = false;
  private foregroundGranted = false;
  private dismissedThisSession = false;

  setPermissionAndConsent(foreground: boolean, consented: boolean) {
    this.foregroundGranted = foreground;
    this.hasConsent = consented;
  }

  getSnapshot(): MockDisclosureState {
    return this.state;
  }

  async promptHomeDisclosureIfNeeded(onConsent?: () => void | Promise<void>): Promise<boolean> {
    if (this.dismissedThisSession) {
      return false;
    }
    // 1. If permission already granted by OS, do not show popup
    if (this.foregroundGranted) {
      return false;
    }
    // 2. If user already consented in this install, do not show popup on every login
    if (this.hasConsent) {
      return false;
    }
    // 3. Fresh install, register first time, or fresh login when permission is not granted
    this.activeCallbacks = onConsent ? { onConsent } : null;
    this.state = { ...this.state, visible: true, loading: false };
    return true;
  }

  async handleConsent(): Promise<void> {
    this.state = { ...this.state, loading: true };
    this.hasConsent = true;
    this.foregroundGranted = true;
    this.state = { ...this.state, visible: false, loading: false };
    const cb = this.activeCallbacks;
    this.activeCallbacks = null;
    if (cb?.onConsent) {
      await cb.onConsent();
    }
  }

  async handleDecline(): Promise<void> {
    this.dismissedThisSession = true;
    this.state = { ...this.state, visible: false, settingsGuideVisible: false };
    const cb = this.activeCallbacks;
    this.activeCallbacks = null;
    if (cb?.onDecline) {
      await cb.onDecline();
    }
  }

  reset() {
    this.state = { visible: false, settingsGuideVisible: false, loading: false };
    this.activeCallbacks = null;
    this.hasConsent = false;
    this.foregroundGranted = false;
    this.dismissedThisSession = false;
  }
}

const runTests = async () => {
  const store = new TestDisclosureStore();

  // Test 1: Initially not visible
  assert.equal(store.getSnapshot().visible, false, 'Initial visible should be false');

  // Test 2: Fresh install / first register / login with permission NOT granted -> shows popup on HomeScreen
  store.setPermissionAndConsent(false, false);
  let homeLocationRefreshed = false;

  const prompted = await store.promptHomeDisclosureIfNeeded(async () => {
    homeLocationRefreshed = true;
  });

  assert.equal(prompted, true, 'promptHomeDisclosureIfNeeded should return true for fresh install without permission');
  assert.equal(store.getSnapshot().visible, true, 'Disclosure modal should appear on HomeScreen');
  assert.equal(homeLocationRefreshed, false, 'Location should not be refreshed before consent');

  // Test 3: User accepts on HomeScreen
  await store.handleConsent();
  assert.equal(store.getSnapshot().visible, false, 'Modal should dismiss after consent');
  assert.equal(homeLocationRefreshed, true, 'Location refresh callback executed on consent');

  // Test 4: Subsequent login / visit when permission is already granted -> does NOT show popup every time
  store.setPermissionAndConsent(true, true);
  const promptedAgain = await store.promptHomeDisclosureIfNeeded();
  assert.equal(promptedAgain, false, 'Should NOT show popup on normal login when permission is already granted');
  assert.equal(store.getSnapshot().visible, false, 'Modal remains closed');

  // Test 5: Re-install simulation (permission reset to false, consent reset to false)
  store.reset();
  store.setPermissionAndConsent(false, false);
  const promptedAfterReinstall = await store.promptHomeDisclosureIfNeeded();
  assert.equal(promptedAfterReinstall, true, 'Shows popup again after fresh install when permission is not granted');
  assert.equal(store.getSnapshot().visible, true, 'Modal opens after reinstall');

  // Test 6: User declines -> modal hides and respects session dismissal
  await store.handleDecline();
  assert.equal(store.getSnapshot().visible, false, 'Modal hides on decline');
  const rePromptDeclined = await store.promptHomeDisclosureIfNeeded();
  assert.equal(rePromptDeclined, false, 'Does not spam popup repeatedly in the same session after decline');

  console.log('locationDisclosureStore HomeScreen tests passed');
};

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
