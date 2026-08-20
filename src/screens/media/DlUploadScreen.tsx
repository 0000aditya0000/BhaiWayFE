import React from 'react';

import { MediaUploadExampleScreen } from './MediaUploadExampleScreen';

export const DlUploadScreen = () => (
  <MediaUploadExampleScreen
    kind="dl"
    title="Driving License"
    subtitle="Camera, gallery, or PDF. Uploads to bhaiway/documents/dl."
    submitLabel="Save DL URL"
  />
);
