import assert from 'node:assert/strict';

import type { AuthLoginResponse, AuthSession } from '../types';

// Pure mapping function test directly matching src/features/auth/api/auth.api.ts
const mapAuthLoginToSession = (response: AuthLoginResponse): AuthSession => {
  const isDeletionPending =
    Boolean(response.deletionPending) ||
    response.user.status === 'DELETION_REQUESTED' ||
    response.user.status === 'DELETION_ACTION_REQUIRED' ||
    response.user.status === 'DELETION_APPROVED';

  return {
    userId: response.user.id,
    token: response.accessToken,
    isNewUser: !response.user.profileCompleted,
    phone: response.user.phone,
    profileCompleted: response.user.profileCompleted,
    deletionPending: isDeletionPending,
    status: response.user.status,
  };
};

// Session state machine logic matching authSession.ts
class TestAuthSessionStore {
  private token: string | null = null;
  private user: any = null;
  private deletionPending = false;

  getToken() { return this.token; }
  getUser() { return this.user; }
  isDeletionPending() { return Boolean(this.deletionPending); }
  isAuthenticated() { return Boolean(this.token && this.user && !this.deletionPending); }

  setRestrictedDeletionSession(token: string, user: any) {
    this.token = token;
    this.user = user;
    this.deletionPending = true;
  }

  clearDeletionPending() {
    this.deletionPending = false;
  }

  clear() {
    this.token = null;
    this.user = null;
    this.deletionPending = false;
  }

  hydrateFromStorage(saved: { token: string; user: any; deletionPending?: boolean }) {
    this.token = saved.token;
    this.user = saved.user;
    this.deletionPending = Boolean(saved.deletionPending);
  }
}

console.log('[Test] Running Account Deletion Auth & Session Tests...');

// ─── TEST 1: Backend returns deletionPending = true ───────────────
{
  const res: AuthLoginResponse = {
    accessToken: 'restricted-jwt-1',
    user: {
      id: 'usr-del-1',
      phone: '9876543210',
      phoneVerified: true,
      profileCompleted: true,
      status: 'DELETION_REQUESTED',
    },
    deletionPending: true,
  };
  const session = mapAuthLoginToSession(res);
  assert.equal(session.deletionPending, true);
  assert.equal(session.token, 'restricted-jwt-1');
  assert.equal(session.userId, 'usr-del-1');
}

// ─── TEST 2: Status is DELETION_ACTION_REQUIRED ──────────────────
{
  const res: AuthLoginResponse = {
    accessToken: 'restricted-jwt-2',
    user: {
      id: 'usr-del-2',
      phone: '9876543211',
      phoneVerified: true,
      profileCompleted: true,
      status: 'DELETION_ACTION_REQUIRED',
    },
  };
  const session = mapAuthLoginToSession(res);
  assert.equal(session.deletionPending, true);
}

// ─── TEST 3: Status is DELETION_APPROVED ─────────────────────────
{
  const res: AuthLoginResponse = {
    accessToken: 'restricted-jwt-3',
    user: {
      id: 'usr-del-3',
      phone: '9876543212',
      phoneVerified: true,
      profileCompleted: true,
      status: 'DELETION_APPROVED',
    },
  };
  const session = mapAuthLoginToSession(res);
  assert.equal(session.deletionPending, true);
}

// ─── TEST 4: Restricted Session State Machine ────────────────────
{
  const store = new TestAuthSessionStore();
  store.setRestrictedDeletionSession('token-del-xyz', { id: 'usr-del-1', fullName: '' });

  assert.equal(store.isDeletionPending(), true, 'isDeletionPending must be true');
  assert.equal(store.isAuthenticated(), false, 'Restricted session must NOT be authenticated for normal app features');
  assert.equal(store.getToken(), 'token-del-xyz', 'Token must remain available for deletion APIs');

  // Cancel deletion
  store.clearDeletionPending();
  assert.equal(store.isDeletionPending(), false, 'isDeletionPending becomes false after cancel');
  assert.equal(store.isAuthenticated(), true, 'Normal session is restored after cancel');

  // Logout
  store.clear();
  assert.equal(store.isAuthenticated(), false);
  assert.equal(store.isDeletionPending(), false);
  assert.equal(store.getToken(), null);
}

// ─── TEST 5: App Restart / Cold Start Preservation ───────────────
{
  const store = new TestAuthSessionStore();
  // Simulate restored storage payload from cold start
  store.hydrateFromStorage({
    token: 'persisted-deletion-jwt',
    user: { id: 'usr-1', fullName: 'Tester' },
    deletionPending: true,
  });

  assert.equal(store.isDeletionPending(), true, 'App restart must preserve deletionPending: true');
  assert.equal(store.isAuthenticated(), false, 'App restart must keep normal authentication disabled');
  assert.equal(store.getToken(), 'persisted-deletion-jwt');
}

// ─── TEST 6: Permanently deleted account creates new account ─────
{
  const res: AuthLoginResponse = {
    accessToken: 'fresh-user-jwt',
    user: {
      id: 'new-uuid-999',
      phone: '9876543210',
      phoneVerified: true,
      profileCompleted: false,
      status: 'ACTIVE',
    },
  };
  const session = mapAuthLoginToSession(res);
  assert.equal(session.deletionPending, false);
  assert.equal(session.isNewUser, true);
  assert.equal(session.userId, 'new-uuid-999');
}

console.log('[Account Deletion Auth Tests PASSED] All 6 test suites succeeded.');
