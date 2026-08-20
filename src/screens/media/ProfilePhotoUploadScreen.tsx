import React from 'react';

import { MediaUploadExampleScreen } from './MediaUploadExampleScreen';

export const ProfilePhotoUploadScreen = () => (
  <MediaUploadExampleScreen
    kind="profile"
    title="Profile Photo"
    subtitle="Square crop, compressed to ~600×600. Uploads to bhaiway/profile."
    submitLabel="Save profile photo URL"
  />
);
