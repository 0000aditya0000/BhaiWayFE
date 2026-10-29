import assert from 'node:assert/strict';

import {
  canClaimMilestone,
  mergeProgressIntoCampaign,
  normalizeCampaign,
  normalizeCampaignList,
  normalizeClaim,
  normalizeMilestone,
  normalizeProgress,
} from './commuteRewards.mapper';

// Backend list item: campaign summary + nested progress (real field names).
{
  const list = normalizeCampaignList({
    items: [
      {
        id: 'camp-1',
        title: 'Office Commute Rewards',
        description: 'Drive more',
        bannerUrl: null,
        status: 'ACTIVE',
        timezone: 'Asia/Kolkata',
        startsAt: '2026-01-01T00:00:00.000Z',
        endsAt: '2026-12-31T23:59:59.000Z',
        configVersion: 1,
        progress: {
          driverId: 'd1',
          campaignId: 'camp-1',
          totalQualifyingTrips: 42,
          campaignStatus: 'ACTIVE',
          campaignEndsAt: '2026-12-31T23:59:59.000Z',
          milestones: [
            {
              milestoneId: 'm1',
              sortOrder: 1,
              title: '42 trips',
              requiredTrips: 42,
              tripCountInWindow: 42,
              remainingTrips: 0,
              windowEndAt: '2026-02-01T00:00:00.000Z',
              windowOpen: true,
              thresholdMet: true,
              precedingClaimed: true,
              canClaim: true,
              claimStatus: 'NONE',
              prizeValueCapInr: 1000,
              prizeDescription: 'Prize up to ₹1,000',
              prizeImageUrl: null,
              windowMonths: 1,
            },
          ],
        },
      },
    ],
  });
  assert.equal(list.length, 1);
  assert.equal(list[0].isActive, true);
  assert.equal(list[0].qualifyingTrips, 42);
  assert.equal(list[0].milestones[0].id, 'm1');
  assert.equal(list[0].milestones[0].qualifyingTrips, 42);
  assert.equal(list[0].milestones[0].eligible, true);
  assert.equal(canClaimMilestone(list[0].milestones[0]), true);
}

// Detail shell milestones (id) + progress milestones (milestoneId / canClaim).
{
  const campaign = normalizeCampaign({
    id: 'camp-1',
    title: 'Rewards',
    description: null,
    bannerUrl: null,
    status: 'ACTIVE',
    timezone: 'Asia/Kolkata',
    startsAt: '2026-01-01T00:00:00.000Z',
    endsAt: '2026-12-31T23:59:59.000Z',
    milestones: [
      {
        id: 'm1',
        sortOrder: 1,
        title: '42 trips',
        requiredTrips: 42,
        windowType: 'CALENDAR_MONTHS_FROM_START',
        windowMonths: 1,
        prizeValueCapInr: 1000,
        prizeDescription: 'Prize',
        prizeImageUrl: null,
      },
    ],
    progress: {
      driverId: 'd1',
      campaignId: 'camp-1',
      totalQualifyingTrips: 10,
      milestones: [
        {
          milestoneId: 'm1',
          sortOrder: 1,
          title: '42 trips',
          requiredTrips: 42,
          tripCountInWindow: 10,
          remainingTrips: 32,
          canClaim: false,
          claimStatus: 'NONE',
          precedingClaimed: true,
          thresholdMet: false,
          prizeValueCapInr: 1000,
          prizeDescription: 'Prize',
          windowMonths: 1,
          windowEndAt: '2026-02-01T00:00:00.000Z',
          windowOpen: true,
        },
      ],
    },
  });
  assert.ok(campaign);
  assert.equal(campaign!.qualifyingTrips, 10);
  assert.equal(campaign!.milestones[0].qualifyingTrips, 10);
  assert.equal(campaign!.milestones[0].eligible, false);
  assert.equal(canClaimMilestone(campaign!.milestones[0]), false);
}

{
  const progress = normalizeProgress(
    {
      driverId: 'd1',
      campaignId: 'camp-1',
      totalQualifyingTrips: 250,
      campaignStatus: 'ACTIVE',
      milestones: [
        {
          milestoneId: 'm2',
          sortOrder: 2,
          title: '250 trips',
          requiredTrips: 250,
          tripCountInWindow: 250,
          canClaim: true,
          claimStatus: 'NONE',
          prizeValueCapInr: 5000,
          windowMonths: 6,
        },
      ],
    },
    'camp-1',
  );
  assert.equal(progress.qualifyingTrips, 250);
  assert.equal(progress.milestones[0].eligible, true);

  const merged = mergeProgressIntoCampaign(
    {
      id: 'camp-1',
      title: 'Rewards',
      description: null,
      bannerUrl: null,
      timezone: 'Asia/Kolkata',
      startsAt: '2026-01-01',
      endsAt: '2026-12-31',
      isActive: true,
      status: 'ACTIVE',
      qualifyingTrips: null,
      milestones: [
        {
          id: 'm2',
          sortOrder: 2,
          title: '250 trips',
          requiredTrips: 250,
          windowMonths: 6,
          prizeValueCapInr: 5000,
          prizeDescription: null,
          prizeImageUrl: null,
          qualifyingTrips: 0,
          eligible: false,
          claimStatus: 'NONE',
          claimId: null,
          claimedAt: null,
          remainingTrips: null,
          precedingClaimed: null,
          thresholdMet: null,
          windowEndAt: null,
        },
      ],
    },
    progress,
  );
  assert.equal(merged.qualifyingTrips, 250);
  assert.equal(merged.milestones[0].eligible, true);
  assert.equal(canClaimMilestone(merged.milestones[0]), true);
}

{
  const underReview = normalizeMilestone({
    milestoneId: 'm1',
    title: '42',
    requiredTrips: 42,
    windowMonths: 1,
    prizeValueCapInr: 1000,
    sortOrder: 1,
    canClaim: false,
    claimStatus: 'UNDER_REVIEW',
    tripCountInWindow: 42,
  });
  assert.ok(underReview);
  assert.equal(canClaimMilestone(underReview!), false);
}

{
  // canClaim true but UNDER_REVIEW must still block duplicate taps.
  const conflict = normalizeMilestone({
    milestoneId: 'm1',
    title: '42',
    requiredTrips: 42,
    windowMonths: 1,
    prizeValueCapInr: 1000,
    sortOrder: 1,
    canClaim: true,
    claimStatus: 'UNDER_REVIEW',
  });
  assert.ok(conflict);
  assert.equal(canClaimMilestone(conflict!), false);
}

{
  const claim = normalizeClaim({
    id: 'cl-1',
    campaignId: 'camp-1',
    driverId: 'd1',
    milestoneId: 'm1',
    status: 'UNDER_REVIEW',
    prizeDescriptionSnapshot: 'Prize up to ₹1,000',
    prizeValueCapInrSnapshot: 1000,
    prizeSnapshot: { title: '42 trips' },
    claimedAt: '2026-03-01T00:00:00.000Z',
    rejectionReason: null,
  });
  assert.ok(claim);
  assert.equal(claim!.status, 'UNDER_REVIEW');
  assert.equal(claim!.prizeDescription, 'Prize up to ₹1,000');
  assert.equal(claim!.milestoneTitle, '42 trips');
  assert.equal(claim!.createdAt, '2026-03-01T00:00:00.000Z');
}

console.log('commuteRewards.mapper.test.ts: ok');
