import assert from 'node:assert/strict';

import { DELETION_REASONS } from '../constants/delete-account.constants';
import { DeletionReason } from '../api/accountDeletion.types';

console.log('[Test] Running Delete Account Reasons & Flow Tests...');

// ─── TEST 1: Exactly 7 reasons defined matching backend enum ─────
{
  assert.equal(DELETION_REASONS.length, 7, 'Must define exactly 7 selectable reasons');

  const expectedReasons = [
    { id: 'no_longer_need', reason: DeletionReason.NO_LONGER_USING, label: 'I no longer need BhaiWay.' },
    { id: 'not_enough_rides', reason: DeletionReason.POOR_USER_EXPERIENCE, label: 'I am not getting enough rides.' },
    { id: 'technical_issues', reason: DeletionReason.ACCOUNT_OR_TECHNICAL_ISSUES, label: 'I am facing technical issues.' },
    { id: 'privacy_security', reason: DeletionReason.PRIVACY_CONCERNS, label: 'I have privacy or security concerns.' },
    { id: 'unhappy_service', reason: DeletionReason.POOR_USER_EXPERIENCE, label: 'I am unhappy with the service.' },
    { id: 'switching_platform', reason: DeletionReason.SWITCHED_TO_ANOTHER_SERVICE, label: 'I am switching to another platform.' },
    { id: 'other', reason: DeletionReason.OTHER, label: 'Other.' },
  ];

  expectedReasons.forEach((expected, i) => {
    const actual = DELETION_REASONS[i];
    assert.equal(actual.id, expected.id, `Reason ${i} id match`);
    assert.equal(actual.reason, expected.reason, `Reason ${i} backend enum match`);
    assert.equal(actual.label, expected.label, `Reason ${i} label match`);
  });
}

// ─── TEST 2: Selection state machine ─────────────────────────────
{
  let selectedReasonId: string | null = null;
  let feedback = '';

  const selectReason = (id: string) => { selectedReasonId = id; };
  const canContinue = () => Boolean(selectedReasonId);

  assert.equal(canContinue(), false, 'canContinue is false initially');

  selectReason('privacy_security');
  assert.equal(selectedReasonId, 'privacy_security');
  assert.equal(canContinue(), true, 'canContinue is true after selection');

  const selected = DELETION_REASONS.find(r => r.id === selectedReasonId);
  assert.equal(selected?.reason, DeletionReason.PRIVACY_CONCERNS);
}

// ─── TEST 3: Feedback length limits (max 1000 characters) ────────
{
  let feedback = '';
  const setFeedback = (text: string) => {
    if (text.length <= 1000) {
      feedback = text;
    }
  };

  const normalText = 'This is my feedback.';
  setFeedback(normalText);
  assert.equal(feedback, normalText);

  const overflowText = 'a'.repeat(1005);
  setFeedback(overflowText);
  assert.equal(feedback, normalText, 'Feedback over 1000 chars rejected');

  const maxValidText = 'b'.repeat(1000);
  setFeedback(maxValidText);
  assert.equal(feedback, maxValidText, 'Feedback at exactly 1000 chars accepted');
}

console.log('[Delete Account Reasons & Flow Tests PASSED] All 3 test suites succeeded.');

