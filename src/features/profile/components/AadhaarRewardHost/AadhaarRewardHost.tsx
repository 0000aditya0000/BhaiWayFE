import React from 'react';

import { useAadhaarReward } from '../../hooks/useAadhaarReward';
import { AadhaarRewardCelebrationModal } from '../AadhaarRewardCelebrationModal';
import { AadhaarRewardClaimModal } from '../AadhaarRewardClaimModal';

/**
 * Root-mounted coordinator for Aadhaar reward claim + celebration modals.
 * Never credits coins — only reflects backend verification + wallet ledger state.
 */
export const AadhaarRewardHost = () => {
  const {
    claimVisible,
    celebrationVisible,
    onClaim,
    onDismissClaim,
    onCelebrationContinue,
  } = useAadhaarReward();

  return (
    <>
      <AadhaarRewardClaimModal
        visible={claimVisible}
        onClaim={onClaim}
        onDismiss={onDismissClaim}
      />
      <AadhaarRewardCelebrationModal
        visible={celebrationVisible}
        onContinue={onCelebrationContinue}
      />
    </>
  );
};
