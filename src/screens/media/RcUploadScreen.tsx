import React from 'react';

import { MediaUploadExampleScreen } from './MediaUploadExampleScreen';

export const RcUploadScreen = () => (
  <MediaUploadExampleScreen
    kind="rc"
    title="Vehicle RC"
    subtitle="Camera, gallery, or PDF. Uploads to bhaiway/documents/rc."
    submitLabel="Save RC URL"
  />
);
